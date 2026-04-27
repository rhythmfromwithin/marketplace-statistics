import { trpc } from "@/lib/trpc";
import { formatPrice, formatDate } from "@/lib/utils";
import type { Platform } from "@/lib/utils";
import { PlatformBadge } from "@/components/PriceBadges";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2 } from "lucide-react";
import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PLATFORM_CHART_COLORS: Record<Platform, string> = {
  amazon: "#c8861a",
  ebay: "#3760f6",
  shopify: "#1a8c4e",
  etsy: "#d05a2a",
};

type PriceType = "landed_price" | "current_price";

export default function PriceHistory() {
  const { t, lang } = useLang();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [days, setDays] = useState(30);
  const [priceType, setPriceType] = useState<PriceType>("landed_price");

  const DAY_OPTIONS = [
    { label: t.days(7), value: 7 },
    { label: t.days(14), value: 14 },
    { label: t.days(30), value: 30 },
  ];

  const { data: products, isLoading: productsLoading } = trpc.products.list.useQuery();
  const effectiveProductId = selectedProductId ?? products?.[0]?.id ?? null;

  const { data: history, isLoading: historyLoading } = trpc.prices.history.useQuery(
    { trackedProductId: effectiveProductId!, days },
    { enabled: effectiveProductId !== null }
  );

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    const byDate = new Map<string, Record<string, number>>();
    for (const snap of history) {
      const dateStr = formatDate(snap.captured_at, lang);
      const existing = byDate.get(dateStr) ?? {};
      existing[snap.platform] = snap[priceType];
      byDate.set(dateStr, existing);
    }
    return Array.from(byDate.entries()).map(([date, prices]) => ({ date, ...prices }));
  }, [history, priceType, lang]);

  const platforms = useMemo(() => {
    if (!history) return [];
    return Array.from(new Set(history.map((h) => h.platform))) as Platform[];
  }, [history]);

  const platformStats = useMemo(() => {
    if (!history || history.length === 0) return [];
    return platforms.map((platform) => {
      const snaps = history.filter((h) => h.platform === platform);
      const prices = snaps.map((s) => s[priceType]);
      const latest = prices[prices.length - 1] ?? 0;
      const oldest = prices[0] ?? 0;
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const change = oldest > 0 ? ((latest - oldest) / oldest) * 100 : 0;
      return { platform, latest, min, max, change };
    });
  }, [history, platforms, priceType]);

  const selectedProduct = products?.find((p) => p.id === effectiveProductId);

  return (
    <div className="flex flex-col gap-6 max-w-[1100px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.historyTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.historySubtitle}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {productsLoading ? (
          <Skeleton className="h-9 w-56" />
        ) : (
          <Select
            value={String(effectiveProductId ?? "")}
            onValueChange={(v) => setSelectedProductId(Number(v))}
          >
            <SelectTrigger className="w-64 bg-card">
              <SelectValue placeholder={t.selectProduct} />
            </SelectTrigger>
            <SelectContent>
              {products?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  <div className="flex items-center gap-2">
                    <PlatformBadge platform={p.platform as Platform} size="sm" />
                    <span className="truncate max-w-[180px]">{p.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32 bg-card">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={priceType} onValueChange={(v) => setPriceType(v as PriceType)}>
          <TabsList className="h-9">
            <TabsTrigger value="landed_price" className="text-xs">{t.landedPrice}</TabsTrigger>
            <TabsTrigger value="current_price" className="text-xs">{t.listPrice}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Platform stat cards */}
      {historyLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : platformStats.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {platformStats.map((stat) => (
            <div key={stat.platform} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
              <PlatformBadge platform={stat.platform as Platform} size="sm" />
              <p className="text-xl font-semibold tabular text-foreground mt-1">{formatPrice(stat.latest)}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {t.priceStatMin} {formatPrice(stat.min)}
                </span>
                <span>
                  {t.priceStatMax} {formatPrice(stat.max)}
                </span>
              </div>
              <span className={`text-xs font-medium ${stat.change >= 0 ? "text-price-up" : "text-price-down"}`}>
                {stat.change >= 0 ? "+" : ""}{stat.change.toFixed(1)}% {t.overPeriod}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Chart */}
      {historyLoading ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : chartData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-xl border border-dashed border-border">
          <BarChart2 className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t.noHistory}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">{selectedProduct?.name}</p>
              <p className="text-xs text-muted-foreground">
                {priceType === "landed_price" ? t.landedPrice : t.listPrice} — {t.chartSubtitleLastDays(days)}
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ebeced" strokeOpacity={0.8} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#9ba0a8" }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ba0a8" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
                width={48}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #ebeced",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#1c222b",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                }}
                formatter={(value, name) => {
                  const num = typeof value === "number" ? value : Number(value);
                  const key = String(name) as Platform;
                  return [formatPrice(num), t.platforms[key] ?? key] as [string, string];
                }}
              />
              <Legend
                formatter={(value) => {
                  const key = String(value) as Platform;
                  return t.platforms[key] ?? key;
                }}
                wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: "#676c78" }}
              />
              {platforms.map((platform) => (
                <Line
                  key={platform}
                  type="monotone"
                  dataKey={platform}
                  stroke={PLATFORM_CHART_COLORS[platform]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
