import { PlatformAPI } from "./base";
import { EbayAPI } from "./ebay";
import { EtsyAPI } from "./etsy";
import { RainforestAPI } from "./rainforest";
import { MockEbayAPI, MockEtsyAPI, MockRainforestAPI } from "./mock";

/**
 * 平台管理器 - 工厂模式
 * 根据平台类型返回对应的 API 实例
 */
class PlatformManager {
  private ebayInstance: PlatformAPI | null = null;
  private etsyInstance: PlatformAPI | null = null;
  private rainforestInstance: PlatformAPI | null = null;

  /**
   * 检查是否启用 Mock 模式
   */
  private isMockMode(): boolean {
    return process.env.USE_MOCK_API === "true";
  }

  /**
   * 获取 eBay API 实例（单例）
   */
  getEbayAPI(): PlatformAPI {
    if (!this.ebayInstance) {
      // Mock 模式：返回 Mock API
      if (this.isMockMode()) {
        console.log("[PlatformManager] Using Mock eBay API");
        this.ebayInstance = new MockEbayAPI();
        return this.ebayInstance;
      }

      // 真实模式：返回真实 API
      const clientId = process.env.EBAY_CLIENT_ID;
      const clientSecret = process.env.EBAY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          "eBay credentials not configured. Set EBAY_CLIENT_ID and EBAY_CLIENT_SECRET in .env, or set USE_MOCK_API=true"
        );
      }

      this.ebayInstance = new EbayAPI(clientId, clientSecret);
    }

    return this.ebayInstance;
  }

  /**
   * 获取 Etsy API 实例（单例）
   */
  getEtsyAPI(): PlatformAPI {
    if (!this.etsyInstance) {
      // Mock 模式：返回 Mock API
      if (this.isMockMode()) {
        console.log("[PlatformManager] Using Mock Etsy API");
        this.etsyInstance = new MockEtsyAPI();
        return this.etsyInstance;
      }

      // 真实模式：返回真实 API
      const apiKey = process.env.ETSY_API_KEY;

      if (!apiKey) {
        throw new Error("Etsy API key not configured. Set ETSY_API_KEY in .env, or set USE_MOCK_API=true");
      }

      this.etsyInstance = new EtsyAPI(apiKey);
    }

    return this.etsyInstance;
  }

  /**
   * 获取 Rainforest API 实例（单例）
   */
  getRainforestAPI(): PlatformAPI {
    if (!this.rainforestInstance) {
      // Mock 模式：返回 Mock API
      if (this.isMockMode()) {
        console.log("[PlatformManager] Using Mock Rainforest API");
        this.rainforestInstance = new MockRainforestAPI();
        return this.rainforestInstance;
      }

      // 真实模式：返回真实 API
      const apiKey = process.env.RAINFOREST_API_KEY;
      const marketplace = process.env.RAINFOREST_MARKETPLACE || "US";

      if (!apiKey) {
        throw new Error(
          "Rainforest API key not configured. Set RAINFOREST_API_KEY in .env, or set USE_MOCK_API=true"
        );
      }

      this.rainforestInstance = new RainforestAPI(apiKey, marketplace);
    }

    return this.rainforestInstance;
  }

  /**
   * 根据平台名称获取 API 实例
   */
  getPlatformAPI(platform: "ebay" | "etsy" | "amazon" | "shopify"): PlatformAPI {
    switch (platform) {
      case "ebay":
        return this.getEbayAPI();
      case "etsy":
        return this.getEtsyAPI();
      case "amazon":
        return this.getRainforestAPI();
      case "shopify":
        throw new Error("Shopify API not yet implemented. Use eBay, Etsy, or Amazon for now.");
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * 跨平台搜索商品
   */
  async searchAcrossPlatforms(
    keyword: string,
    platforms: Array<"ebay" | "etsy" | "amazon">,
    limit: number = 20
  ): Promise<Array<{ platform: string; results: any[] }>> {
    const searches = platforms.map(async (platform) => {
      try {
        const api = this.getPlatformAPI(platform);
        const results = await api.search(keyword, limit);
        return { platform, results };
      } catch (error) {
        console.error(`[${platform}] Search failed:`, error);
        return { platform, results: [] };
      }
    });

    return Promise.all(searches);
  }
}

// 导出单例
export const platformManager = new PlatformManager();

// 导出类型和类
export type { PlatformAPI };
export { EbayAPI, EtsyAPI, RainforestAPI };
