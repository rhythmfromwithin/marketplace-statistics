import { trpc } from "@/lib/trpc";
import { formatPrice } from "@/lib/utils";

type SellerGroup = {
  sellerId: string;
  products: string[];
  avgLandedPrice: number;
  latestPlatform: string;
};

export default function CompetitorShops() {
  const { data: rows, isLoading } = trpc.prices.dashboard.useQuery();

  const sellerMap = new Map<string, SellerGroup>();
  for (const row of rows ?? []) {
    const sellerId = row.seller_id?.trim();
    if (!sellerId) continue;
    const existing = sellerMap.get(sellerId);
    if (!existing) {
      sellerMap.set(sellerId, {
        sellerId,
        products: [row.productName],
        avgLandedPrice: row.landed_price,
        latestPlatform: row.platform,
      });
      continue;
    }
    if (!existing.products.includes(row.productName)) {
      existing.products.push(row.productName);
    }
    existing.avgLandedPrice = (existing.avgLandedPrice + row.landed_price) / 2;
    existing.latestPlatform = row.platform;
  }

  const sellers = Array.from(sellerMap.values()).sort((a, b) => b.products.length - a.products.length);

  return (
    <div className="flex flex-col gap-4 max-w-[1200px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Competitor Shops</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Sellers discovered from tracked product snapshots.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading competitor stores...</div>
      ) : sellers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
          No competitor shops yet. Add products or store URLs in AI Agent.
        </div>
      ) : (
        <div className="grid gap-3">
          {sellers.map((seller) => (
            <div key={seller.sellerId} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{seller.sellerId}</p>
                  <p className="text-xs text-muted-foreground">{seller.products.length} tracked products</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatPrice(seller.avgLandedPrice)}</p>
                  <p className="text-xs text-muted-foreground">Avg landed · {seller.latestPlatform}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 truncate">{seller.products.join(" · ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
