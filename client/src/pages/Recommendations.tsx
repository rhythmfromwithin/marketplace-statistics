import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";
import { PlatformBadge } from "@/components/PriceBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Sparkles, Settings2, TrendingDown, TrendingUp, Target, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import type { Platform } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";

export default function Recommendations() {
  const { t } = useLang();
  const utils = trpc.useUtils();
  const { data: marginRules, isLoading: rulesLoading } = trpc.marginRules.get.useQuery();
  const { data: recommendations, isLoading: recsLoading } = trpc.recommendations.getAll.useQuery();

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    minMarginPct: 15,
    targetMarginPct: 25,
    cogPerUnit: 32,
    platformFeePct: 12,
    shippingCost: 5,
  });

  useEffect(() => {
    if (marginRules) {
      setForm({
        minMarginPct: marginRules.minMarginPct,
        targetMarginPct: marginRules.targetMarginPct,
        cogPerUnit: marginRules.cogPerUnit,
        platformFeePct: marginRules.platformFeePct,
        shippingCost: marginRules.shippingCost,
      });
    }
  }, [marginRules]);

  const updateMutation = trpc.marginRules.update.useMutation({
    onSuccess: () => {
      utils.marginRules.get.invalidate();
      utils.recommendations.getAll.invalidate();
      toast.success(t.marginUpdated);
      setEditMode(false);
    },
    onError: (err) => toast.error(`${t.updateFailed}${err.message}`),
  });

  const handleSave = () => {
    if (form.minMarginPct >= form.targetMarginPct) {
      toast.error(t.targetMustBeHigher);
      return;
    }
    updateMutation.mutate(form);
  };

  const marginItems = [
    { label: t.cogsLabel, value: formatPrice(form.cogPerUnit) },
    { label: t.platformFeeLabel, value: `${form.platformFeePct}%` },
    { label: t.shippingLabel, value: formatPrice(form.shippingCost) },
    { label: t.minMarginLabel, value: `${form.minMarginPct}%` },
    { label: t.targetMarginLabel, value: `${form.targetMarginPct}%`, accent: true },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-[1000px]">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.recsTitle}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t.recsSubtitle}</p>
      </div>

      {/* Margin Rules Config */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t.marginRules}</span>
          </div>
          {!editMode ? (
            <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
              {t.configure}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>{t.cancel}</Button>
              <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t.saving : t.saveRules}
              </Button>
            </div>
          )}
        </div>

        {rulesLoading ? (
          <div className="p-5 grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
        ) : editMode ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex flex-col gap-2">
              <Label>{t.cogsPerUnit}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.cogPerUnit}
                  onChange={(e) => setForm((f) => ({ ...f, cogPerUnit: parseFloat(e.target.value) || 0 }))}
                  className="pl-8 font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.platformFee}</Label>
              <Input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={form.platformFeePct}
                onChange={(e) => setForm((f) => ({ ...f, platformFeePct: parseFloat(e.target.value) || 0 }))}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t.shippingCost}</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.shippingCost}
                  onChange={(e) => setForm((f) => ({ ...f, shippingCost: parseFloat(e.target.value) || 0 }))}
                  className="pl-8 font-mono"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <Label>{t.minMargin}</Label>
                <span className="text-sm font-mono font-medium text-foreground">{form.minMarginPct}%</span>
              </div>
              <Slider
                min={0}
                max={50}
                step={1}
                value={[form.minMarginPct]}
                onValueChange={([v]) => setForm((f) => ({ ...f, minMarginPct: v ?? f.minMarginPct }))}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center justify-between">
                <Label>{t.targetMargin}</Label>
                <span className="text-sm font-mono font-medium text-primary">{form.targetMarginPct}%</span>
              </div>
              <Slider
                min={0}
                max={60}
                step={1}
                value={[form.targetMarginPct]}
                onValueChange={([v]) => setForm((f) => ({ ...f, targetMarginPct: v ?? f.targetMarginPct }))}
                className="w-full"
              />
            </div>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {marginItems.map((item) => (
              <div key={item.label} className={`flex flex-col gap-1 rounded-lg p-3 ${item.accent ? "bg-primary/10 border border-primary/20" : "bg-muted/30"}`}>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</span>
                <span className={`text-lg font-semibold tabular ${item.accent ? "text-primary" : "text-foreground"}`}>{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations */}
      <div>
        <h2 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {t.suggestedPricesTitle}
        </h2>

        {recsLoading ? (
          <div className="flex flex-col gap-3">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : !recommendations || recommendations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
            <Sparkles className="w-8 h-8 text-muted-foreground/40" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{t.noRecs}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.noRecsHint}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.product.id} rec={rec} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Recommendation Card ──────────────────────────────────────────────────────
type RecData = {
  product: { id: number; name: string; platform: string; category: string | null };
  lowestLanded: number;
  avgMarket: number;
  minPrice: number;
  targetPrice: number;
  suggestedPrice: number;
  estimatedMarginPct: number;
};

function RecommendationCard({ rec }: { rec: RecData }) {
  const { t } = useLang();
  const isGoodMargin = rec.estimatedMarginPct >= 15;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/20">
        <PlatformBadge platform={rec.product.platform as Platform} />
        <div>
          <p className="text-sm font-medium text-foreground">{rec.product.name}</p>
          {rec.product.category && (
            <p className="text-xs text-muted-foreground">{rec.product.category}</p>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3 h-3 text-price-up" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.lowestLanded}</span>
            </div>
            <span className="text-lg font-semibold tabular text-price-up">{formatPrice(rec.lowestLanded)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.avgMarket}</span>
            </div>
            <span className="text-lg font-semibold tabular text-foreground">{formatPrice(rec.avgMarket)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.minPriceFloor}</span>
            </div>
            <span className="text-lg font-semibold tabular text-foreground">{formatPrice(rec.minPrice)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{t.targetPrice}</span>
            </div>
            <span className="text-lg font-semibold tabular text-primary">{formatPrice(rec.targetPrice)}</span>
          </div>
        </div>

        <div className={`flex items-center justify-between rounded-xl p-4 ${isGoodMargin ? "bg-primary/8 border border-primary/20" : "bg-destructive/8 border border-destructive/20"}`}>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.suggestedPrice}</p>
            <p className="text-3xl font-bold tabular text-foreground">{formatPrice(rec.suggestedPrice)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.competitivePositioning}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.estMargin}</p>
            <p className={`text-2xl font-bold tabular ${isGoodMargin ? "text-price-up" : "text-price-down"}`}>
              {rec.estimatedMarginPct.toFixed(1)}%
            </p>
            <p className={`text-xs mt-1 ${isGoodMargin ? "text-price-up" : "text-price-down"}`}>
              {isGoodMargin ? t.aboveMin : t.belowMin}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
            <span>{t.floor} {formatPrice(rec.minPrice)}</span>
            <span>{t.suggested} {formatPrice(rec.suggestedPrice)}</span>
            <span>{t.target} {formatPrice(rec.targetPrice)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{
                width: `${Math.min(100, ((rec.suggestedPrice - rec.minPrice) / (rec.targetPrice - rec.minPrice + 0.01)) * 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
