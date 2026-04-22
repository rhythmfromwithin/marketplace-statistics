import { PlatformAPI, SearchResult, PriceData, RateLimiter } from "./base";

/**
 * eBay Browse API 集成
 * 文档: https://developer.ebay.com/api-docs/buy/browse/resources/methods
 * Rate Limit: 5 req/s (默认 5,000次/天)
 */
export class EbayAPI implements PlatformAPI {
  private limiter: RateLimiter;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly marketplaceId: string = "EBAY_US"
  ) {
    // 5 req/s, burst 10
    this.limiter = new RateLimiter(5, 10);
  }

  /**
   * OAuth 2.0 认证 - 获取 Application Token
   */
  private async getAccessToken(): Promise<string> {
    // 如果 token 还有效，直接返回
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString("base64");

    const response = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${credentials}`,
      },
      body: "grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`eBay OAuth failed: ${response.status} ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    // 提前 5 分钟过期
    this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this.accessToken!;
  }

  /**
   * 搜索商品
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();
    const token = await this.getAccessToken();

    const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
    url.searchParams.set("q", keyword);
    url.searchParams.set("limit", limit.toString());

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": this.marketplaceId,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`eBay search failed: ${res.status} ${error}`);
      }

      return res;
    });

    const data = await response.json();

    if (!data.itemSummaries || data.itemSummaries.length === 0) {
      return [];
    }

    return data.itemSummaries.map((item: any) => this.mapToSearchResult(item));
  }

  /**
   * 获取商品价格详情
   */
  async getPrice(itemId: string): Promise<PriceData> {
    await this.limiter.acquire();
    const token = await this.getAccessToken();

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(`https://api.ebay.com/buy/browse/v1/item/${itemId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-EBAY-C-MARKETPLACE-ID": this.marketplaceId,
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`eBay getPrice failed: ${res.status} ${error}`);
      }

      return res;
    });

    const item = await response.json();
    return this.mapToPriceData(item);
  }

  /**
   * 指数退避重试机制
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 500
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // 如果是 401，刷新 token 后重试
        if (lastError.message.includes("401")) {
          this.accessToken = null;
          this.tokenExpiry = 0;
        }

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(`[eBay] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("eBay API request failed after retries");
  }

  /**
   * 将 eBay itemSummary 映射到 SearchResult
   */
  private mapToSearchResult(item: any): SearchResult {
    const price = parseFloat(item.price?.value ?? "0");
    const shipping = parseFloat(item.shippingOptions?.[0]?.shippingCost?.value ?? "0");

    return {
      platformProductId: item.itemId,
      title: item.title ?? "",
      currentPrice: price,
      shippingPrice: shipping,
      landedPrice: Math.round((price + shipping) * 100) / 100,
      sellerId: item.seller?.username ?? "",
      availability: this.mapAvailability(item.availabilityStatus),
      imageUrl: item.image?.imageUrl ?? "",
      productUrl: item.itemWebUrl ?? "",
      currency: item.price?.currency ?? "USD",
    };
  }

  /**
   * 将 eBay item 详情映射到 PriceData
   */
  private mapToPriceData(item: any): PriceData {
    const price = parseFloat(item.price?.value ?? "0");
    const shipping = parseFloat(item.shippingOptions?.[0]?.shippingCost?.value ?? "0");

    return {
      platformProductId: item.itemId,
      title: item.title ?? "",
      currentPrice: price,
      shippingPrice: shipping,
      landedPrice: Math.round((price + shipping) * 100) / 100,
      sellerId: item.seller?.username ?? "",
      availability: this.mapAvailability(item.availabilityStatus),
      imageUrl: item.image?.imageUrl ?? "",
      productUrl: item.itemWebUrl ?? "",
      currency: item.price?.currency ?? "USD",
    };
  }

  /**
   * 映射 eBay 库存状态到统一格式
   */
  private mapAvailability(status: string | undefined): "in_stock" | "limited" | "out_of_stock" {
    switch (status?.toUpperCase()) {
      case "IN_STOCK":
        return "in_stock";
      case "LIMITED_STOCK":
        return "limited";
      case "OUT_OF_STOCK":
        return "out_of_stock";
      default:
        return "in_stock";
    }
  }
}
