import { PlatformAPI, SearchResult, PriceData, RateLimiter } from "./base";
import {
  MOCK_EBAY_PRODUCTS,
  MOCK_ETSY_PRODUCTS,
  MOCK_AMAZON_PRODUCTS,
  generatePriceVariation,
  searchProducts,
} from "./mockData";

/**
 * Mock eBay API - 用于测试和开发
 * 完全实现 PlatformAPI 接口，返回真实感的模拟数据
 */
export class MockEbayAPI implements PlatformAPI {
  private limiter: RateLimiter;

  constructor() {
    // 模拟 eBay 的限速：5 req/s
    this.limiter = new RateLimiter(5, 10);
  }

  /**
   * 搜索商品 - 返回模拟数据
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();

    // 模拟网络延迟 100-300ms
    await this.simulateNetworkDelay(100, 300);

    // 搜索匹配的商品
    const matchedProducts = searchProducts(MOCK_EBAY_PRODUCTS, keyword, limit);

    // 应用价格波动
    return matchedProducts.map((product) => {
      const varied = generatePriceVariation(product);
      return {
        platformProductId: varied.id,
        title: varied.title,
        currentPrice: varied.basePrice,
        shippingPrice: varied.shippingBase,
        landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
        sellerId: varied.seller,
        availability: varied.stockStatus,
        imageUrl: varied.imageUrl,
        productUrl: `https://www.ebay.com/itm/${varied.id}`,
        currency: varied.currency,
      };
    });
  }

  /**
   * 获取商品价格详情
   */
  async getPrice(productId: string): Promise<PriceData> {
    await this.limiter.acquire();

    // 模拟网络延迟
    await this.simulateNetworkDelay(80, 200);

    // 查找商品，未找到则生成随机价格
    const product = MOCK_EBAY_PRODUCTS.find((p) => p.id === productId) ?? {
      id: productId,
      title: `eBay Item ${productId}`,
      basePrice: Math.round((15 + Math.random() * 150) * 100) / 100,
      shippingBase: Math.random() > 0.5 ? 0 : Math.round(Math.random() * 15 * 100) / 100,
      seller: "mock-ebay-seller",
      stockStatus: "in_stock" as const,
      imageUrl: "",
      currency: "USD",
    };

    // 应用价格波动
    const varied = generatePriceVariation(product);

    return {
      platformProductId: varied.id,
      title: varied.title,
      currentPrice: varied.basePrice,
      shippingPrice: varied.shippingBase,
      landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
      sellerId: varied.seller,
      availability: varied.stockStatus,
      imageUrl: varied.imageUrl,
      productUrl: `https://www.ebay.com/itm/${varied.id}`,
      currency: varied.currency,
    };
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Mock Etsy API - 用于测试和开发
 * 完全实现 PlatformAPI 接口，返回真实感的模拟数据
 */
export class MockEtsyAPI implements PlatformAPI {
  private limiter: RateLimiter;

  constructor() {
    // 模拟 Etsy 的限速：10 req/s
    this.limiter = new RateLimiter(10, 20);
  }

  /**
   * 搜索商品 - 返回模拟数据
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();

    // 模拟网络延迟 80-250ms
    await this.simulateNetworkDelay(80, 250);

    // 搜索匹配的商品
    const matchedProducts = searchProducts(MOCK_ETSY_PRODUCTS, keyword, limit);

    // 应用价格波动
    return matchedProducts.map((product) => {
      const varied = generatePriceVariation(product);
      return {
        platformProductId: varied.id,
        title: varied.title,
        currentPrice: varied.basePrice,
        shippingPrice: varied.shippingBase,
        landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
        sellerId: varied.seller,
        availability: varied.stockStatus,
        imageUrl: varied.imageUrl,
        productUrl: `https://www.etsy.com/listing/${varied.id.replace("etsy-", "")}`,
        currency: varied.currency,
      };
    });
  }

  /**
   * 获取商品价格详情
   */
  async getPrice(productId: string): Promise<PriceData> {
    await this.limiter.acquire();

    // 模拟网络延迟
    await this.simulateNetworkDelay(60, 180);

    // 查找商品，未找到则生成随机价格
    const product = MOCK_ETSY_PRODUCTS.find((p) => p.id === productId) ?? {
      id: productId,
      title: `Etsy Listing ${productId}`,
      basePrice: Math.round((10 + Math.random() * 100) * 100) / 100,
      shippingBase: Math.random() > 0.4 ? 0 : Math.round(Math.random() * 8 * 100) / 100,
      seller: "mock-etsy-seller",
      stockStatus: "in_stock" as const,
      imageUrl: "",
      currency: "USD",
    };

    // 应用价格波动
    const varied = generatePriceVariation(product);

    return {
      platformProductId: varied.id,
      title: varied.title,
      currentPrice: varied.basePrice,
      shippingPrice: varied.shippingBase,
      landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
      sellerId: varied.seller,
      availability: varied.stockStatus,
      imageUrl: varied.imageUrl,
      productUrl: `https://www.etsy.com/listing/${varied.id.replace("etsy-", "")}`,
      currency: varied.currency,
    };
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}

/**
 * Mock Rainforest API - 用于测试和开发 (Amazon 数据)
 * 完全实现 PlatformAPI 接口，返回真实感的模拟数据
 * 模拟真实 API 的响应格式和响应时间（1-6秒）
 */
export class MockRainforestAPI implements PlatformAPI {
  private limiter: RateLimiter;
  private creditsRemaining: number = 10000;

  constructor() {
    // 模拟 Rainforest 的限速：2 req/s
    this.limiter = new RateLimiter(2, 5);
  }

  /**
   * 搜索商品 - 返回模拟数据（匹配真实 API 响应格式）
   */
  async search(keyword: string, limit: number = 20): Promise<SearchResult[]> {
    await this.limiter.acquire();

    // 模拟真实 API 的响应时间：1-6秒
    await this.simulateNetworkDelay(1000, 6000);

    // 搜索匹配的商品
    const matchedProducts = searchProducts(MOCK_AMAZON_PRODUCTS, keyword, limit);

    // 模拟 credit 消耗
    this.creditsRemaining -= 1;

    // 记录 credit 使用情况（模拟真实 API）
    console.log(
      `[Mock Rainforest] Credits used: 1, remaining: ${this.creditsRemaining}`
    );

    // 应用价格波动
    return matchedProducts.map((product) => {
      const varied = generatePriceVariation(product);
      return {
        platformProductId: varied.id,
        title: varied.title,
        currentPrice: varied.basePrice,
        shippingPrice: varied.shippingBase,
        landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
        sellerId: varied.seller,
        availability: varied.stockStatus,
        imageUrl: varied.imageUrl,
        productUrl: `https://www.amazon.com/dp/${varied.id}`,
        currency: varied.currency,
      };
    });
  }

  /**
   * 获取商品价格详情 - 模拟真实 API 响应格式
   */
  async getPrice(asin: string): Promise<PriceData> {
    await this.limiter.acquire();

    // 模拟真实 API 的响应时间：1-6秒
    await this.simulateNetworkDelay(1000, 6000);

    // 查找商品，未找到则生成随机价格（mock 模式支持任意 ASIN）
    const product = MOCK_AMAZON_PRODUCTS.find((p) => p.id === asin) ?? {
      id: asin,
      title: `Amazon Product ${asin}`,
      basePrice: Math.round((20 + Math.random() * 180) * 100) / 100,
      shippingBase: Math.random() > 0.6 ? 0 : Math.round(Math.random() * 10 * 100) / 100,
      seller: "mock-seller",
      stockStatus: "in_stock" as const,
      imageUrl: "",
      currency: "USD",
    };

    // 模拟 credit 消耗
    this.creditsRemaining -= 1;

    // 记录 credit 使用情况（模拟真实 API）
    console.log(
      `[Mock Rainforest] Credits used: 1, remaining: ${this.creditsRemaining}`
    );

    // 应用价格波动
    const varied = generatePriceVariation(product);

    return {
      platformProductId: varied.id,
      title: varied.title,
      currentPrice: varied.basePrice,
      shippingPrice: varied.shippingBase,
      landedPrice: Math.round((varied.basePrice + varied.shippingBase) * 100) / 100,
      sellerId: varied.seller,
      availability: varied.stockStatus,
      imageUrl: varied.imageUrl,
      productUrl: `https://www.amazon.com/dp/${varied.id}`,
      currency: varied.currency,
    };
  }

  /**
   * 模拟网络延迟
   */
  private async simulateNetworkDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
