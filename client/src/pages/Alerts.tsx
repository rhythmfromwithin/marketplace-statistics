import { trpc } from "@/lib/trpc";
import { formatPrice, formatDateTime } from "@/lib/utils";
import type { Platform } from "@/lib/utils";
import { PlatformBadge, DeltaBadge } from "@/components/PriceBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Bell, BellOff, Plus, Trash2, CheckCheck } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

export default function Alerts() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    trackedProductId: "",
    thresholdPct: "5",
    direction: "any" as "up" | "down" | "any",
  });

  const utils = trpc.useUtils();
  const { data: rules, isLoading: rulesLoading } = trpc.alerts.rules.useQuery();
  const { data: events, isLoading: eventsLoading } = trpc.alerts.events.useQuery();
  const { data: products } = trpc.products.list.useQuery();

  const createMutation = trpc.alerts.createRule.useMutation({
    onSuccess: () => {
      utils.alerts.rules.invalidate();
      utils.alerts.unreadCount.invalidate();
      toast.success(lang === "zh" ? "预警规则已创建" : "Alert rule created");
      setOpen(false);
      setForm({ trackedProductId: "", thresholdPct: "5", direction: "any" });
    },
    onError: (err) => toast.error(`${t.failedPrefix}${err.message}`),
  });

  const deleteMutation = trpc.alerts.deleteRule.useMutation({
    onSuccess: () => {
      utils.alerts.rules.invalidate();
      toast.success(lang === "zh" ? "规则已删除" : "Alert rule deleted");
    },
  });

  const toggleMutation = trpc.alerts.toggleRule.useMutation({
    onSuccess: () => utils.alerts.rules.invalidate(),
  });

  const markReadMutation = trpc.alerts.markRead.useMutation({
    onSuccess: () => {
      utils.alerts.events.invalidate();
      utils.alerts.unreadCount.invalidate();
    },
  });

  const markAllReadMutation = trpc.alerts.markAllRead.useMutation({
    onSuccess: () => {
      utils.alerts.events.invalidate();
      utils.alerts.unreadCount.invalidate();
      toast.success(lang === "zh" ? "全部已标为已读" : "All alerts marked as read");
    },
  });

  const unreadCount = events?.filter((e) => !e.isRead).length ?? 0;

  const handleCreate = () => {
    if (!form.trackedProductId) {
      toast.error(lang === "zh" ? "请选择商品" : "Please select a product");
      return;
    }
    const pct = parseFloat(form.thresholdPct);
    if (isNaN(pct) || pct <= 0) {
      toast.error(lang === "zh" ? "阈值必须为正数" : "Threshold must be a positive number");
      return;
    }
    createMutation.mutate({
      trackedProductId: Number(form.trackedProductId),
      thresholdPct: pct,
      direction: form.direction,
    });
  };

  const directionOptions = [
    { value: "any", label: lang === "zh" ? "任意方向" : "Any direction" },
    { value: "up", label: lang === "zh" ? "仅涨价" : "Price increase only" },
    { value: "down", label: lang === "zh" ? "仅降价" : "Price decrease only" },
  ];

  const directionLabel = (d: string) => {
    const map: Record<string, string> = { any: lang === "zh" ? "任意" : "Any", up: lang === "zh" ? "涨价" : "Up", down: lang === "zh" ? "降价" : "Down" };
    return map[d] ?? d;
  };

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.alertsTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.alertsSubtitle}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              {t.newAlertRule}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.createRule}</DialogTitle>
              <DialogDescription>{t.createRuleDesc}</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label>{t.product}</Label>
                <Select
                  value={form.trackedProductId}
                  onValueChange={(v) => setForm((f) => ({ ...f, trackedProductId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectProduct} />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={p.platform as Platform} size="sm" />
                          <span className="truncate max-w-[200px]">{p.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="threshold">{t.threshold}</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={form.thresholdPct}
                  onChange={(e) => setForm((f) => ({ ...f, thresholdPct: e.target.value }))}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">{t.thresholdHint}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>{t.direction}</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm((f) => ({ ...f, direction: v as "up" | "down" | "any" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {directionOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? t.creating : t.createRuleBtn}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events" className="gap-2">
            {t.alertLog}
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold bg-destructive text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">{t.rules} ({rules?.length ?? 0})</TabsTrigger>
        </TabsList>

        {/* Alert Events */}
        <TabsContent value="events" className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted-foreground">{t.unread(unreadCount)}</p>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={() => markAllReadMutation.mutate()}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.markAllRead}
              </Button>
            )}
          </div>
          {eventsLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
              <Bell className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t.noAlerts}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors cursor-pointer ${
                    event.isRead ? "border-border bg-card opacity-60" : "border-border bg-card"
                  }`}
                  onClick={() => !event.isRead && markReadMutation.mutate({ id: event.id })}
                >
                  {!event.isRead && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  {event.isRead && <span className="w-2 h-2 shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground truncate">{event.productName}</span>
                      <PlatformBadge platform={event.platform as Platform} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatPrice(event.previousPrice)} → {formatPrice(event.currentPrice)}
                    </p>
                  </div>
                  <DeltaBadge changePct={event.changePct} direction={event.direction} />
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                    {formatDateTime(event.triggeredAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Alert Rules */}
        <TabsContent value="rules" className="mt-4">
          {rulesLoading ? (
            <div className="flex flex-col gap-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : !rules || rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-xl border border-dashed border-border">
              <BellOff className="w-8 h-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{t.noRules}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{rule.productName}</span>
                      <PlatformBadge platform={rule.platform as Platform} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lang === "zh" ? "阈值" : "Threshold"}: <span className="font-mono font-medium text-foreground">{rule.thresholdPct}%</span>
                      {" · "}
                      {lang === "zh" ? "方向" : "Direction"}: <span className="font-medium text-foreground">{directionLabel(rule.direction)}</span>
                    </p>
                  </div>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, isActive: v })}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: rule.id })}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
