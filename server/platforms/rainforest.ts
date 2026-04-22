import { PlatformAPI, SearchResult, PriceData, RateLimiter } from "./base";

/**
 * Rainforest API 集成 - Amazon 数据抓取
 * 文档: https://docs.rainforestapi.com/
 * Rate Limit: 根据套餐不同，建议 2 req/s 保守限速
 *
 * 特点:
 * - 专注 Amazon 数据抓取
 * - 支持所有 Amazon 市场
 * - 可获取 ASIN、价格、运费、卖家信息、BuyBox、库存状态
 * - 不需要 Amazon 权限，开箱即用
 */
export class RainforestAPI implements PlatformAPI {
  private limiter: RateLimiter;
  private readonly baseUrl = "https://api.rainforestapi.com/request";

  constructor(
    private readonly apiKey: string,
    private readonly marketplace: string = "US"
  ) {
    // 保守限速: 2 req/s, burst 5
    this.limiter = new RateLimiter(2, 5);
  }

  /**
   * 搜索 Amazon 商品
   * 使用 Rainforest 的 search 端点
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: "search",
      amazon_domain: this.getAmazonDomain(),
      search_term: keyword,
      max_page: "1",
    });

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Rainforest search failed: ${res.status} ${error}`);
      }

      return res;
    });

    const data = await response.json();

    // 检查 API 响应是否成功
    if (!data.request_info?.success) {
      const errorMsg = data.error?.message || "Unknown error";
      throw new Error(`Rainforest API error: ${errorMsg}`);
    }

    // 记录 credit 使用情况
    console.log(
      `[Rainforest] Credits used: ${data.request_info.credits_used}, ` +
      `remaining: ${data.request_info.credits_remaining}`
    );

    if (!data.search_results || data.search_results.length === 0) {
      return [];
    }

    return data.search_results
      .slice(0, limit)
      .map((item: any) => this.mapToSearchResult(item));
  }

  /**
   * 获取商品价格详情
   * 使用 Rainforest 的 product 端点
   */
  async getPrice(asin: string): Promise<PriceData> {
    await this.limiter.acquire();

    const params = new URLSearchParams({
      api_key: this.apiKey,
      type: "product",
      amazon_domain: this.getAmazonDomain(),
      asin: asin,
    });

    const response = await this.retryWithBackoff(async () => {
      const res = await fetch(`${this.baseUrl}?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Rainforest getPrice failed: ${res.status} ${error}`);
      }

      return res;
    });

    const data = await response.json();

    // 检查 API 响应是否成功
    if (!data.request_info?.success) {
      const errorMsg = data.error?.message || "Unknown error";
      throw new Error(`Rainforest API error: ${errorMsg}`);
    }

    // 记录 credit 使用情况
    console.log(
      `[Rainforest] Credits used: ${data.request_info.credits_used}, ` +
      `remaining: ${data.request_info.credits_remaining}`
    );

    if (!data.product) {
      throw new Error(`Rainforest: Product not found for ASIN: ${asin}`);
    }

    return this.mapToPriceData(data.product);
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

        if (attempt < maxRetries) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          console.warn(
            `[Rainforest] Retry ${attempt + 1}/${maxRetries} after ${delay}ms: ${lastError.message}`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError ?? new Error("Rainforest API request failed after retries");
  }

  /**
   * 根据 marketplace 返回对应的 Amazon 域名
   */
  private getAmazonDomain(): string {
    const domainMap: Record<string, string> = {
      US: "amazon.com",
      UK: "amazon.co.uk",
      DE: "amazon.de",
      FR: "amazon.fr",
      IT: "amazon.it",
      ES: "amazon.es",
      CA: "amazon.ca",
      JP: "amazon.co.jp",
      IN: "amazon.in",
      MX: "amazon.com.mx",
      BR: "amazon.com.br",
      AU: "amazon.com.au",
    };

    return domainMap[this.marketplace] ?? "amazon.com";
  }

  /**
   * 将 Rainforest search_results 映射到 SearchResult
   */
  private mapToSearchResult(item: any): SearchResult {
    const price = this.parseMoney(item.prices?.primary?.value ?? item.price?.value);
    const shipping = this.parseShipping(item.prices?.shipping?.raw ?? item.prices?.shipping?.value);

    return {
      platformProductId: item.asin ?? "",
      title: item.title ?? "",
      currentPrice: price,
      shippingPrice: shipping,
      landedPrice: Math.round((price + shipping) * 100) / 100,
      sellerId: item.seller?.name ?? item.brand ?? "Amazon",
      availability: this.mapAvailability(item.availability?.type),
      imageUrl: item.image ?? item.images?.[0] ?? "",
      productUrl: item.link ?? `https://${this.getAmazonDomain()}/dp/${item.asin}`,
      currency: item.prices?.primary?.currency ?? "USD",
    };
  }

  /**
   * 将 Rainforest product 详情映射到 PriceData
   */
  private mapToPriceData(product: any): PriceData {
    const buybox = product.buybox_winner;
    const price = this.parseMoney(buybox?.price?.value ?? product.price?.value);
    const shipping = this.parseShipping(buybox?.shipping?.raw ?? buybox?.shipping?.value);

    return {
      platformProductId: product.asin ?? "",
      title: product.title ?? "",
      currentPrice: price,
      shippingPrice: shipping,
      landedPrice: Math.round((price + shipping) * 100) / 100,
      sellerId: buybox?.fulfillment?.third_party_seller?.name ?? buybox?.seller?.name ?? product.brand ?? "Amazon",
      availability: this.mapAvailability(buybox?.availability?.type ?? product.availability?.type),
      imageUrl: product.main_image?.link ?? product.images?.[0] ?? "",
      productUrl: product.link ?? `https://${this.getAmazonDomain()}/dp/${product.asin}`,
      currency: buybox?.price?.currency ?? product.price?.currency ?? "USD",
    };
  }

  /**
   * Parse money values from number / currency string safely.
   * Handles "1,299.99", "$29.99", "USD 29.99", and plain numbers.
   */
  private parseMoney(raw: unknown): number {
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    if (typeof raw !== "string") return 0;

    const normalized = raw.replace(/,/g, "");
    const match = normalized.match(/-?\d+(?:\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }

  /**
   * Parse shipping text from Rainforest responses.
   * Examples: "FREE", "FREE delivery Friday, May 3", "$5.99", 0, 5.99
   */
  private parseShipping(raw: unknown): number {
    if (raw == null) return 0;
    if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
    if (typeof raw !== "string") return 0;

    const normalized = raw.trim().toUpperCase();
    if (normalized.includes("FREE")) return 0;
    return this.parseMoney(raw);
  }

  /**
   * 映射 Amazon 库存状态到统一格式
   */
  private mapAvailability(status: string | undefined): "in_stock" | "limited" | "out_of_stock" {
    if (!status) return "in_stock";

    const statusLower = status.toLowerCase();

    if (statusLower.includes("in stock") || statusLower.includes("available")) {
      return "in_stock";
    }

    if (
      statusLower.includes("limited") ||
      statusLower.includes("only") ||
      statusLower.includes("few left")
    ) {
      return "limited";
    }

    if (
      statusLower.includes("out of stock") ||
      statusLower.includes("unavailable") ||
      statusLower.includes("not available")
    ) {
      return "out_of_stock";
    }

    return "in_stock";
  }
}
