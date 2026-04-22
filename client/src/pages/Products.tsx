import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import type { Platform } from "@/lib/utils";
import { PlatformBadge } from "@/components/PriceBadges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2, Package, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/contexts/LanguageContext";

const CATEGORIES_EN = ["Electronics", "Peripherals", "Home Office", "Accessories", "Lifestyle", "Clothing", "Sports", "Other"];
const CATEGORIES_ZH = ["电子产品", "外设", "家庭办公", "配件", "生活用品", "服装", "运动", "其他"];

export default function Products() {
  const { t, lang } = useLang();
  const categories = lang === "zh" ? CATEGORIES_ZH : CATEGORIES_EN;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    productUrl: "",
    category: "",
    isOwn: false,
  });

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.list.useQuery();

  const addMutation = trpc.products.addFromAmazonUrl.useMutation({
    onSuccess: async (result) => {
      utils.products.list.invalidate();
      utils.prices.dashboard.invalidate();
      utils.prices.history.invalidate();
      setOpen(false);
      setForm({ productUrl: "", category: "", isOwn: false });
      if (result.alreadyExists) {
        toast.message(lang === "zh" ? "该商品已存在，已定位到现有记录" : "Product already exists. Reusing existing entry.");
      } else {
        toast.success(lang === "zh" ? "商品已添加并完成首次价格抓取" : "Product added and initial price fetched.");
      }
    },
    onError: (err) => toast.error(`${t.failedPrefix}${err.message}`),
  });

  const removeMutation = trpc.products.remove.useMutation({
    onSuccess: () => {
      utils.products.list.invalidate();
      utils.prices.dashboard.invalidate();
      toast.success(lang === "zh" ? "商品已移除" : "Product removed");
    },
    onError: () => toast.error(lang === "zh" ? "移除失败" : "Failed to remove product"),
  });

  const handleAdd = () => {
    if (!form.productUrl.trim()) {
      toast.error(lang === "zh" ? "请先粘贴 Amazon 商品链接" : "Please paste an Amazon product link.");
      return;
    }
    addMutation.mutate({
      url: form.productUrl.trim(),
      category: form.category || undefined,
      isOwn: form.isOwn,
    });
  };

  const grouped = products
    ? Array.from(
        products.reduce((map, p) => {
          const key = p.name;
          const existing = map.get(key) ?? [];
          existing.push(p);
          map.set(key, existing);
          return map;
        }, new Map<string, typeof products>())
      )
    : [];

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t.productsTitle}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t.productsSubtitle}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              {t.newProduct}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{t.addProductTitle}</DialogTitle>
              <DialogDescription>
                {lang === "zh"
                  ? "粘贴 Amazon 商品链接，系统会自动识别 ASIN、抓取商品信息并加入监控。"
                  : "Paste an Amazon product link and the system will auto-detect ASIN, fetch details, and start tracking."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="url">{t.productUrl}</Label>
                <Input
                  id="url"
                  placeholder={
                    lang === "zh"
                      ? "https://www.amazon.com/dp/B0XXXXXXXX"
                      : "https://www.amazon.com/dp/B0XXXXXXXX"
                  }
                  value={form.productUrl}
                  onChange={(e) => setForm((f) => ({ ...f, productUrl: e.target.value }))}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="category">{t.category}</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder={t.categoryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">{t.isOwnProduct}</p>
                  <p className="text-xs text-muted-foreground">{t.isOwnProductDesc}</p>
                </div>
                <Switch
                  checked={form.isOwn}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, isOwn: v }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button>
              <Button onClick={handleAdd} disabled={addMutation.isPending}>
                {addMutation.isPending ? t.adding : t.add}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Product list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3 rounded-xl border border-dashed border-border">
          <Package className="w-10 h-10 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-foreground">{t.noTrackedProducts}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.addFirstProductHint}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-muted-foreground">{t.trackedCount(products?.length ?? 0)}</p>
          {grouped.map(([name, entries]) => (
            <div key={name} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{name}</span>
                  {entries[0]?.isOwn && (
                    <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded tracking-wide">{t.myProduct}</span>
                  )}
                  {entries[0]?.category && (
                    <span className="text-xs text-muted-foreground">· {entries[0].category}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">
                  {entries.length} {lang === "zh" ? "个平台" : `platform${entries.length > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="divide-y divide-border/50">
                {entries.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/20 transition-colors">
                    <PlatformBadge platform={product.platform as Platform} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-muted-foreground truncate">{product.platformProductId}</p>
                    </div>
                    {product.productUrl && (
                      <a
                        href={product.productUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(product.createdAt)}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t.removeProductTitle}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t.removeProductDesc(product.name)}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeMutation.mutate({ id: product.id })}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            {removeMutation.isPending ? t.removing : t.remove}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
