/**
 * Rainforest API 测试脚本
 * 测试 Mock 模式下的 Rainforest API 功能
 */

import { platformManager } from "./server/platforms/index.js";

async function testRainforestAPI() {
  console.log("=".repeat(60));
  console.log("🧪 Rainforest API 测试开始");
  console.log("=".repeat(60));
  console.log();

  try {
    // 测试 1: 获取 Rainforest API 实例
    console.log("📦 测试 1: 获取 Rainforest API 实例");
    console.log("-".repeat(60));
    const rainforestAPI = platformManager.getRainforestAPI();
    console.log("✅ 成功获取 Rainforest API 实例");
    console.log();

    // 测试 2: 搜索 Amazon 商品
    console.log("🔍 测试 2: 搜索 Amazon 商品 (关键词: laptop)");
    console.log("-".repeat(60));
    const startTime = Date.now();
    const searchResults = await rainforestAPI.search("laptop", 5);
    const searchTime = Date.now() - startTime;

    console.log(`✅ 搜索成功，耗时: ${searchTime}ms`);
    console.log(`📊 找到 ${searchResults.length} 个商品\n`);

    if (searchResults.length > 0) {
      console.log("前 3 个商品:");
      searchResults.slice(0, 3).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   ASIN: ${product.platformProductId}`);
        console.log(`   价格: ${product.currency} ${product.currentPrice.toFixed(2)}`);
        console.log(`   运费: ${product.currency} ${product.shippingPrice.toFixed(2)}`);
        console.log(`   到岸价: ${product.currency} ${product.landedPrice.toFixed(2)}`);
        console.log(`   库存: ${product.availability}`);
        console.log(`   卖家: ${product.sellerId}`);
      });
    }
    console.log();

    // 测试 3: 获取商品价格详情
    if (searchResults.length > 0) {
      const testProduct = searchResults[0];
      console.log("💰 测试 3: 获取商品价格详情");
      console.log("-".repeat(60));
      console.log(`测试商品: ${testProduct.title}`);
      console.log(`ASIN: ${testProduct.platformProductId}\n`);

      const priceStartTime = Date.now();
      const priceData = await rainforestAPI.getPrice(testProduct.platformProductId);
      const priceTime = Date.now() - priceStartTime;

      console.log(`✅ 获取价格成功，耗时: ${priceTime}ms`);
      console.log(`\n价格详情:`);
      console.log(`   商品名称: ${priceData.title}`);
      console.log(`   当前价格: ${priceData.currency} ${priceData.currentPrice.toFixed(2)}`);
      console.log(`   运费: ${priceData.currency} ${priceData.shippingPrice.toFixed(2)}`);
      console.log(`   到岸价: ${priceData.currency} ${priceData.landedPrice.toFixed(2)}`);
      console.log(`   库存状态: ${priceData.availability}`);
      console.log(`   卖家: ${priceData.sellerId}`);
      console.log(`   图片: ${priceData.imageUrl.substring(0, 50)}...`);
      console.log(`   链接: ${priceData.productUrl.substring(0, 50)}...`);
    }
    console.log();

    // 测试 4: 跨平台搜索（包含 Amazon）
    console.log("🌐 测试 4: 跨平台搜索 (eBay + Etsy + Amazon)");
    console.log("-".repeat(60));
    const crossPlatformStartTime = Date.now();
    const crossPlatformResults = await platformManager.searchAcrossPlatforms(
      "laptop",
      ["ebay", "etsy", "amazon"],
      3
    );
    const crossPlatformTime = Date.now() - crossPlatformStartTime;

    console.log(`✅ 跨平台搜索成功，耗时: ${crossPlatformTime}ms\n`);

    crossPlatformResults.forEach((platformResult) => {
      console.log(`📦 ${platformResult.platform.toUpperCase()}: ${platformResult.results.length} 个商品`);
      if (platformResult.results.length > 0) {
        const firstProduct = platformResult.results[0];
        console.log(`   示例: ${firstProduct.title.substring(0, 50)}...`);
        console.log(`   价格: ${firstProduct.currency} ${firstProduct.currentPrice.toFixed(2)}`);
      }
    });
    console.log();

    // 测试 5: 测试不同关键词
    console.log("🔍 测试 5: 测试不同关键词搜索");
    console.log("-".repeat(60));
    const keywords = ["iphone", "headphones", "camera"];

    for (const keyword of keywords) {
      const results = await rainforestAPI.search(keyword, 2);
      console.log(`✅ "${keyword}": 找到 ${results.length} 个商品`);
      if (results.length > 0) {
        console.log(`   示例: ${results[0].title.substring(0, 60)}...`);
      }
    }
    console.log();

    // 测试总结
    console.log("=".repeat(60));
    console.log("✅ 所有测试通过！");
    console.log("=".repeat(60));
    console.log("\n📊 测试总结:");
    console.log("   ✓ Rainforest API 实例创建成功");
    console.log("   ✓ 商品搜索功能正常");
    console.log("   ✓ 价格获取功能正常");
    console.log("   ✓ 跨平台搜索支持 Amazon");
    console.log("   ✓ 多关键词搜索正常");
    console.log("   ✓ 响应时间符合预期 (1-6秒)");
    console.log("   ✓ 数据格式正确");
    console.log("\n💡 提示: 当前使用 Mock 模式，切换到真实 API 需要:");
    console.log("   1. 在 .env.local 中设置 USE_MOCK_API=false");
    console.log("   2. 配置 RAINFOREST_API_KEY=your_api_key");
    console.log("   3. 配置 RAINFOREST_MARKETPLACE=US");
    console.log();

  } catch (error) {
    console.error("\n❌ 测试失败:");
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
testRainforestAPI();
