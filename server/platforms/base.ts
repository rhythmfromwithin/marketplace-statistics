export interface PriceData {
  platformProductId: string;
  title: string;
  currentPrice: number;
  shippingPrice: number;
  landedPrice: number;
  sellerId: string;
  availability: "in_stock" | "limited" | "out_of_stock";
  imageUrl: string;
  productUrl: string;
  currency: string;
}

export interface SearchResult {
  platformProductId: string;
  title: string;
  currentPrice: number;
  shippingPrice: number;
  landedPrice: number;
  sellerId: string;
  availability: "in_stock" | "limited" | "out_of_stock";
  imageUrl: string;
  productUrl: string;
  currency: string;
}

export interface PlatformAPI {
  search(keyword: string, limit?: number): Promise<SearchResult[]>;
  getPrice(productId: string): Promise<PriceData>;
}

// 简单的令牌桶限速器
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly ratePerSecond: number,
    private readonly burst: number
  ) {
    this.tokens = burst;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.burst, this.tokens + elapsed * this.ratePerSecond);
    this.lastRefill = now;

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    const waitMs = ((1 - this.tokens) / this.ratePerSecond) * 1000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.tokens = 0;
  }
}
