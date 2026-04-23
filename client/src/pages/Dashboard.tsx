import { trpc } from "@/lib/trpc";
import { formatPrice, formatRelativeTime } from "@/lib/utils";
import type { Platform, Availability } from "@/lib/utils";
import { PlatformBadge, DeltaBadge, AvailabilityBadge, StatCard } from "@/components/PriceBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { RefreshCw, Search, Activity } from "lucide-react";
import { useState, useMemo } from "react";
import { useLang } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { t } = useLang();
  const utils = trpc.useUtils();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState("");
  const [pollingName, setPollingName] = useState<string | null>(null);
  const [pollingProgress, setPollingProgress] = useState<{ current: number; total: number } | null>(null);

  const { data: rows, isLoading, refetch } = trpc.prices.dashboard.useQuery(undefined, {
    refetchInterval: 60000,
  });
  const { data: allProducts } = trpc.products.list.useQuery();

  const pollMutation = trpc.prices.poll.useMutation({
    onSuccess: (result) => {
      refetch();
      if (result.triggered.length > 0) {
        toast.warning(`${result.triggered.length} ${t.nav.alerts.toLowerCase()}!`);
      } else {
        toast.success(t.refresh);
      }
    },
    onError: (err) => {
      toast.error(t.failedPrefix + t.refresh.toLowerCase(), {
        action: {
          label: "Retry",
          onClick: () => {
            if (pollingName) {
              const group = grouped.find(g => g.name === pollingName);
              if (group) handlePoll(group.entries.map(e => e.trackedProductId), group.name);
            }
          }
        }
      });
      setPollingName(null);
      setPollingProgress(null);
    },
  });

  const mockLoginMutation = trpc.auth.mockLogin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      await Promise.all([
        utils.products.list.invalidate(),
        utils.prices.dashboard.invalidate(),
      ]);
      toast.success("Logged in");
    },
    onError: (error) => {
      toast.error(`Login failed: ${error.message}`);
    },
  });

  const handlePoll = async (ids: number[], name: string) => {
    setPollingName(name);
    setPollingProgress({ current: 0, total: ids.length });

    toast.info(`Polling ${ids.length} product${ids.length > 1 ? 's' : ''}...`);

    for (let i = 0; i < ids.length; i++) {
      setPollingProgress({ current: i + 1, total: ids.length });
      await pollMutation.mutateAsync({ trackedProductId: ids[i] });
    }

    setPollingName(null);
    setPollingProgress(null);
  };

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.platform.toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const totalProducts = new Set(rows.map((r) => r.trackedProductId)).size;
    const priceDrops = rows.filter((r) => r.direction === "down").length;
    const priceRises = rows.filter((r) => r.direction === "up").length;
    const avgLanded = rows.reduce((a, b) => a + b.landed_price, 0) / rows.length;
    return { totalProducts, priceDrops, priceRises, avgLanded };
  }, [rows]);

  const marketInsight = useMemo(() => {
    if (!rows || rows.length === 0) return null;
    const biggestDrop = rows
      .filter((r) => r.direction === "down")
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
    const biggestRise = rows
      .filter((r) => r.direction === "up")
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))[0];
    const latestCapture = rows
      .map((r) => new Date(r.captured_at).getTime())
      .sort((a, b) => b - a)[0];
    return {
      biggestDrop,
      biggestRise,
      latestCapture: latestCapture ? new Date(latestCapture) : null,
    };
  }, [rows]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    const visibleRows = isAuthenticated ? filtered : filtered.slice(0, 20);
    for (const row of visibleRows) {
      const key = row.productName;
      const existing = map.get(key) ?? [];
      existing.push(row);
      map.set(key, existing);
    }
    return Array.from(map.entries()).map(([name, entries]) => ({
      id: entries[0]?.trackedProductId ?? 0,
      name,
      category: entries[0]?.category ?? null,
      isOwn: entries[0]?.isOwn ?? false,
      entries,
    }));
  }, [filtered, isAuthenticated]);

  // Products that exist but have no price snapshots yet
  const snapshotProductIds = useMemo(() => new Set(rows?.map((r) => r.trackedProductId) ?? []), [rows]);
  const unpricedProducts = useMemo(() => {
    if (!isAuthenticated) return [];
    if (!allProducts) return [];
    const q = search.toLowerCase();
    return allProducts.filter(
      (p) => !snapshotProductIds.has(p.id) && (p.name.toLowerCase().includes(q) || p.platform.toLowerCase().includes(q))
    );
  }, [allProducts, snapshotProductIds, search, isAuthenticated]);

  return (
    <div className="flex flex-col gap-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.dashboardSubtitle}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 shrink-0" aria-label={t.refresh} title={t.refresh}>
          <RefreshCw className="w-3.5 h-3.5" />
          {t.refresh}
        </Button>
      </div>

      {/* Stats row */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" role="status" aria-live="polite" aria-label="Loading dashboard statistics">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label={t.trackedProducts} value={String(stats.totalProducts)} sub={t.acrossAllPlatforms} />
          <StatCard label={t.priceDrops} value={String(stats.priceDrops)} sub={t.sinceLastPoll} delta={{ changePct: -stats.priceDrops, direction: "down" }} />
          <StatCard label={t.priceRises} value={String(stats.priceRises)} sub={t.sinceLastPoll} delta={{ changePct: stats.priceRises, direction: "up" }} />
          <StatCard label={t.avgLandedPrice} value={formatPrice(stats.avgLanded)} sub={t.allPlatforms} accent />
        </div>
      ) : null}

      {marketInsight && (
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Market insight</p>
          <div className="grid gap-2 md:grid-cols-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Largest drop</p>
              <p className="font-medium">
                {marketInsight.biggestDrop
                  ? `${marketInsight.biggestDrop.productName} (${marketInsight.biggestDrop.changePct.toFixed(2)}%)`
                  : "No drop detected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Largest rise</p>
              <p className="font-medium">
                {marketInsight.biggestRise
                  ? `${marketInsight.biggestRise.productName} (+${marketInsight.biggestRise.changePct.toFixed(2)}%)`
                  : "No rise detected"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data freshness</p>
              <p className="font-medium tabular-nums">
                {marketInsight.latestCapture ? formatRelativeTime(marketInsight.latestCapture) : "No data"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-border"
        />
      </div>

      {/* Price table */}
      <div className="relative">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : grouped.length === 0 && unpricedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <Activity className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground text-sm">{t.noProducts}</p>
            <p className="text-muted-foreground/60 text-xs">{t.addFirstProduct}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {grouped.map((group) => (
              <ProductPriceCard
                key={group.id}
                group={group}
                onPoll={(ids) => handlePoll(ids, group.name)}
                isPolling={pollingName === group.name}
                disablePoll={!isAuthenticated}
              />
            ))}
            {unpricedProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-dashed border-border bg-card/50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={product.platform as Platform} />
                    <div>
                      <span className="font-medium text-sm text-foreground">{product.name}</span>
                      <p className="text-xs font-mono text-muted-foreground">{product.platformProductId}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePoll([product.id], product.name)}
                    disabled={pollingName === product.name}
                    className="gap-1.5 text-xs h-7 px-2.5 shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${pollingName === product.name ? "animate-spin" : ""}`} />
                    {pollingName === product.name ? "…" : "获取价格"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isAuthenticated && (
          <div className="absolute inset-x-0 bottom-0 h-[52%] bg-gradient-to-t from-background via-background/95 to-transparent flex items-end justify-center pb-10">
            <div className="rounded-xl border border-border bg-card px-5 py-4 text-center shadow-sm">
              <p className="text-sm font-medium text-foreground">Login to unlock full data & actions</p>
              <p className="text-xs text-muted-foreground mt-1">
                You are viewing a preview of 20 products.
              </p>
              <Button className="mt-3" size="sm" onClick={() => mockLoginMutation.mutate()} disabled={mockLoginMutation.isPending}>
                {t.signIn}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Product Price Card ───────────────────────────────────────────────────────
type PriceRow = {
  snapshotId: number;
  trackedProductId: number;
  productName: string;
  category: string | null;
  isOwn: boolean;
  platform: string;
  current_price: number;
  shipping_price: number;
  landed_price: number;
  availability: string;
  seller_id: string | null;
  currency: string;
  captured_at: Date;
  previousPrice: number;
  changePct: number;
  direction: string;
};

function ProductPriceCard({
  group,
  onPoll,
  isPolling,
  disablePoll,
}: {
  group: { id: number; name: string; category: string | null; isOwn: boolean; entries: PriceRow[] };
  onPoll: (ids: number[]) => void;
  isPolling: boolean;
  disablePoll: boolean;
}) {
  const { t } = useLang();
  const lowestLanded = Math.min(...group.entries.map((e) => e.landed_price));

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-foreground truncate">{group.name}</span>
              {group.isOwn && (
                <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded tracking-wide">{t.myProduct}</span>
              )}
            </div>
            {group.category && (
              <span className="text-xs text-muted-foreground">{group.category}</span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPoll(group.entries.map(e => e.trackedProductId))}
          disabled={isPolling || disablePoll}
          className="gap-1.5 text-xs h-7 px-2.5 text-muted-foreground hover:text-foreground shrink-0"
          aria-label={isPolling ? "Polling..." : t.poll}
          title={isPolling ? "Polling..." : t.poll}
        >
          <RefreshCw className={`w-3 h-3 ${isPolling ? "animate-spin" : ""}`} />
          {isPolling ? "…" : t.poll}
        </Button>
      </div>

      <div className="divide-y divide-border/50">
        {group.entries.map((entry) => (
          <PlatformPriceRow
            key={`${entry.trackedProductId}-${entry.platform}`}
            entry={entry}
            isLowest={entry.landed_price === lowestLanded}
          />
        ))}
      </div>
    </div>
  );
}

function PlatformPriceRow({ entry, isLowest }: { entry: PriceRow; isLowest: boolean }) {
  const { t } = useLang();
  return (
    <div className={`flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors ${isLowest ? "bg-price-up/5" : ""}`}>
      <div className="w-24 shrink-0">
        <PlatformBadge platform={entry.platform as Platform} />
      </div>

      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.current}</span>
          <span className="text-sm font-semibold tabular text-foreground">{formatPrice(entry.current_price)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.shipping}</span>
          <span className="text-sm tabular text-muted-foreground">
            {entry.shipping_price === 0
              ? <span className="text-price-up text-xs font-medium">{t.freeShipping}</span>
              : formatPrice(entry.shipping_price)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.landed}</span>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold tabular ${isLowest ? "text-price-up" : "text-foreground"}`}>
              {formatPrice(entry.landed_price)}
            </span>
            {isLowest && <span className="text-[9px] font-bold text-price-up uppercase tracking-wider">{t.lowest}</span>}
          </div>
        </div>
      </div>

      <div className="w-20 shrink-0 flex justify-center">
        <DeltaBadge changePct={entry.changePct} direction={entry.direction} />
      </div>

      <div className="w-24 shrink-0">
        <AvailabilityBadge availability={entry.availability as Availability} />
      </div>

      <div className="hidden lg:flex flex-col items-end shrink-0 text-right">
        {entry.seller_id && (
          <span className="text-[10px] text-muted-foreground/70 font-mono truncate max-w-[120px]">{entry.seller_id}</span>
        )}
        <span className="text-[10px] text-muted-foreground/50">{formatRelativeTime(entry.captured_at)}</span>
      </div>
    </div>
  );
}
