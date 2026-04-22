import { PlatformAPI, SearchResult, PriceData, RateLimiter } from "./base";

/**
 * Etsy Open API v3 集成
 * 文档: https://developer.etsy.com/documentation/
 * Rate Limit: 10 req/s, 10,000次/天
 */
export class EtsyAPI implements PlatformAPI {
  private limiter: RateLimiter;

  constructor(private readonly apiKey: string) {
    // 10 req/s, burst 20
    this.limiter = new RateLimiter(10, 20);
  }

  /**
   * 搜索商品
   * 注意: Etsy API v3 需要先搜索 listings，然后获取详情
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();

    const url = new URL("https://openapi.etsy.com/v3/application/listings/active");
    url.searchParams.set("keywords", keyword);
    url.searchParams.set("limit", Math.min(limit, 100).toString());
    url.searchParams.set("includes", "Images,Shop");

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(url.toString(), {
        headers: {
          "x-api-key": this.apiKey,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Etsy search failed: ${res.status} ${error}`);
      }

      return res;
    });

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return [];
    }

    return data.results.map((listing: any) => this.mapToSearchResult(listing));
  }

  /**
   * 获取商品价格详情
   */
  async getPrice(listingId: string): Promise<PriceData> {
    await this.limiter.acquire();

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(
        `https://openapi.etsy.com/v3/application/listings/${listingId}?includes=Images,Shop`,
        {
          headers: {
            "x-api-key": this.apiKey,
          },
        }
      );

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Etsy getPrice failed: ${res.status} ${error}`);
      }

      return res;
    });

    const listing = await response.json();
    return this.mapToPriceData(listing);
  }

  /**
   * 指数退避重试机制
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 300
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(`[Etsy] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("Etsy API request failed after retries");
  }

  /**
   * 将 Etsy listing 映射到 SearchResult
   */
  private mapToSearchResult(listing: any): SearchResult {
    const price = listing.price ? listing.price.amount / listing.price.divisor : 0;
    const imageUrl = listing.images?.[0]?.url_570xN ?? listing.images?.[0]?.url_fullxfull ?? "";

    return {
      platformProductId: listing.listing_id.toString(),
      title: listing.title ?? "",
      currentPrice: Math.round(price * 100) / 100,
      shippingPrice: 0, // Etsy 运费需要单独查询 shipping profiles
      landedPrice: Math.round(price * 100) / 100,
      sellerId: listing.shop_id?.toString() ?? listing.shop?.shop_id?.toString() ?? "",
      availability: listing.quantity > 0 ? "in_stock" : "out_of_stock",
      imageUrl,
      productUrl: listing.url ?? `https://www.etsy.com/listing/${listing.listing_id}`,
      currency: listing.price?.currency_code ?? "USD",
    };
  }

  /**
   * 将 Etsy listing 详情映射到 PriceData
   */
  private mapToPriceData(listing: any): PriceData {
    const price = listing.price ? listing.price.amount / listing.price.divisor : 0;
    const imageUrl = listing.images?.[0]?.url_570xN ?? listing.images?.[0]?.url_fullxfull ?? "";

    return {
      platformProductId: listing.listing_id.toString(),
      title: listing.title ?? "",
      currentPrice: Math.round(price * 100) / 100,
      shippingPrice: 0,
      landedPrice: Math.round(price * 100) / 100,
      sellerId: listing.shop_id?.toString() ?? "",
      availability: listing.quantity > 0 ? "in_stock" : "out_of_stock",
      imageUrl,
      productUrl: listing.url ?? `https://www.etsy.com/listing/${listing.listing_id}`,
      currency: listing.price?.currency_code ?? "USD",
    };
  }
}
