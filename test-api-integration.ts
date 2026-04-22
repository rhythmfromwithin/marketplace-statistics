#!/usr/bin/env tsx
/**
 * API 集成测试脚本
 * 测试 eBay, Etsy, Rainforest (Amazon) 三个平台的 API 接入
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, ".env.local") });

import { platformManager } from "./server/platforms/index.js";

console.log("=".repeat(70));
console.log("🧪 电商平台 API 集成测试");
console.log("=".repeat(70));
console.log();

async function testPlatform(
  platformName: string,
  testFn: () => Promise<void>
) {
  console.log(`\n📦 测试 ${platformName}`);
  console.log("-".repeat(70));
  try {
    const startTime = Date.now();
    await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${platformName} 测试通过 (耗时: ${duration}ms)`);
  } catch (error) {
    console.log(`❌ ${platformName} 测试失败:`);
    console.error(error instanceof Error ? error.message : error);
  }
}

async function main() {
  // 测试 1: Rainforest API (Amazon)
  await testPlatform("Rainforest API (Amazon)", async () => {
    const api = platformManager.getRainforestAPI();

    // 搜索测试
    console.log("  🔍 搜索 'laptop' (限制 3 个结果)...");
    const searchResults = await api.search("laptop", 3);
    console.log(`  📊 找到 ${searchResults.length} 个商品`);

    if (searchResults.length > 0) {
      const product = searchResults[0];
      console.log(`\n  示例商品:`);
      console.log(`    标题: ${product.title.substring(0, 60)}...`);
      console.log(`    ASIN: ${product.platformProductId}`);
      console.log(`    价格: ${product.currency} ${product.currentPrice.toFixed(2)}`);
      console.log(`    运费: ${product.currency} ${product.shippingPrice.toFixed(2)}`);
      console.log(`    到岸价: ${product.currency} ${product.landedPrice.toFixed(2)}`);
      console.log(`    库存: ${product.availability}`);
      console.log(`    卖家: ${product.sellerId}`);

      // 价格详情测试
      console.log(`\n  💰 获取价格详情...`);
      const priceData = await api.getPrice(product.platformProductId);
      console.log(`  ✓ 价格详情获取成功`);
      console.log(`    当前价格: ${priceData.currency} ${priceData.currentPrice.toFixed(2)}`);
    }
  });

  // 测试 2: eBay API
  await testPlatform("eBay API", async () => {
    const api = platformManager.getEbayAPI();

    console.log("  🔍 搜索 'laptop' (限制 3 个结果)...");
    const searchResults = await api.search("laptop", 3);
    console.log(`  📊 找到 ${searchResults.length} 个商品`);

    if (searchResults.length > 0) {
      const product = searchResults[0];
      console.log(`\n  示例商品:`);
      console.log(`    标题: ${product.title.substring(0, 60)}...`);
      console.log(`    Item ID: ${product.platformProductId}`);
      console.log(`    价格: ${product.currency} ${product.currentPrice.toFixed(2)}`);
      console.log(`    运费: ${product.currency} ${product.shippingPrice.toFixed(2)}`);
    }
  });

  // 测试 3: Etsy API
  await testPlatform("Etsy API", async () => {
    const api = platformManager.getEtsyAPI();

    console.log("  🔍 搜索 'handmade wallet' (限制 3 个结果)...");
    const searchResults = await api.search("handmade wallet", 3);
    console.log(`  📊 找到 ${searchResults.length} 个商品`);

    if (searchResults.length > 0) {
      const product = searchResults[0];
      console.log(`\n  示例商品:`);
      console.log(`    标题: ${product.title.substring(0, 60)}...`);
      console.log(`    Listing ID: ${product.platformProductId}`);
      console.log(`    价格: ${product.currency} ${product.currentPrice.toFixed(2)}`);
    }
  });

  // 测试 4: 跨平台搜索
  console.log(`\n\n🌐 测试跨平台搜索`);
  console.log("-".repeat(70));
  try {
    const results = await platformManager.searchAcrossPlatforms(
      "laptop",
      ["ebay", "etsy", "amazon"],
      2
    );

    console.log(`✅ 跨平台搜索成功\n`);
    results.forEach((platformResult) => {
      console.log(`  📦 ${platformResult.platform.toUpperCase()}: ${platformResult.results.length} 个商品`);
      if (platformResult.results.length > 0) {
        const first = platformResult.results[0];
        console.log(`     示例: ${first.title.substring(0, 50)}...`);
        console.log(`     价格: ${first.currency} ${first.currentPrice.toFixed(2)}`);
      }
    });
  } catch (error) {
    console.log(`❌ 跨平台搜索失败:`);
    console.error(error instanceof Error ? error.message : error);
  }

  // 总结
  console.log("\n" + "=".repeat(70));
  console.log("✅ 测试完成！");
  console.log("=".repeat(70));
  console.log("\n💡 提示:");
  console.log("  - 当前使用 Mock 模式 (USE_MOCK_API=true)");
  console.log("  - 切换到真实 API:");
  console.log("    1. 在 .env.local 中设置 USE_MOCK_API=false");
  console.log("    2. 配置真实的 API 凭证:");
  console.log("       - EBAY_CLIENT_ID=your_ebay_client_id");
  console.log("       - EBAY_CLIENT_SECRET=your_ebay_client_secret");
  console.log("       - ETSY_API_KEY=your_etsy_api_key");
  console.log("       - RAINFOREST_API_KEY=your_rainforest_api_key");
  console.log();
}

main().catch(console.error);
