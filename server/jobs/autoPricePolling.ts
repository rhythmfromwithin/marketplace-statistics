import { getAllTrackedProducts, insertPriceSnapshot } from "../db";
import { platformManager } from "../platforms";

const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;

export function startAutoPricePolling(intervalMs: number = FOUR_HOURS_MS) {
  const run = async () => {
    try {
      const products = await getAllTrackedProducts();
      if (products.length === 0) return;

      for (const product of products) {
        if (product.platform === "shopify") continue;
        try {
          const api = platformManager.getPlatformAPI(product.platform as "amazon" | "ebay" | "etsy");
          const priceData = await api.getPrice(product.platformProductId);
          await insertPriceSnapshot({
            trackedProductId: product.id,
            platform: product.platform,
            current_price: priceData.currentPrice,
            shipping_price: priceData.shippingPrice,
            landed_price: priceData.landedPrice,
            availability: priceData.availability,
            seller_id: priceData.sellerId,
          });
        } catch (error) {
          console.error(`[AutoPolling] Failed on product ${product.id}:`, error);
        }
      }
    } catch (error) {
      console.error("[AutoPolling] Run failed:", error);
    }
  };

  setInterval(run, intervalMs);
}
