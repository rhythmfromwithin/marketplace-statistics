/**
 * Seed script: populates the database with realistic mock price intelligence data.
 * Run via: npx tsx server/seed.ts
 */
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import {
  trackedProducts,
  priceSnapshots,
  alertRules,
  alertEvents,
  marginRules,
} from "../drizzle/schema";
import dotenv from "dotenv";
dotenv.config();

const PLATFORMS = ["amazon", "ebay", "shopify", "etsy"] as const;
type Platform = (typeof PLATFORMS)[number];

// ─── Mock product catalogue ───────────────────────────────────────────────────
const PRODUCTS = [
  {
    name: "Wireless Noise-Cancelling Headphones",
    category: "Electronics",
    isOwn: true,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B09XY12345", seller_id: "AMZN_SELLER_001", basePrice: 89.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098765", seller_id: "ebay_techdeals", basePrice: 84.50, shipping: 4.99 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891234", seller_id: "soundstore.myshopify.com", basePrice: 92.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234567", seller_id: "AudioCraftShop", basePrice: 97.00, shipping: 5.50 },
    ],
  },
  {
    name: "Ergonomic Mechanical Keyboard",
    category: "Peripherals",
    isOwn: false,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B08KBDM123", seller_id: "AMZN_SELLER_002", basePrice: 129.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098766", seller_id: "ebay_keyboardking", basePrice: 119.00, shipping: 6.99 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891235", seller_id: "typehaven.myshopify.com", basePrice: 134.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234568", seller_id: "MechKeyMakers", basePrice: 145.00, shipping: 8.00 },
    ],
  },
  {
    name: "Portable Bluetooth Speaker",
    category: "Electronics",
    isOwn: false,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B07XYZABC1", seller_id: "AMZN_SELLER_003", basePrice: 49.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098767", seller_id: "ebay_soundwave", basePrice: 44.00, shipping: 3.99 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891236", seller_id: "bassboost.myshopify.com", basePrice: 52.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234569", seller_id: "SoundCraftCo", basePrice: 55.00, shipping: 4.00 },
    ],
  },
  {
    name: "Minimalist Leather Wallet",
    category: "Accessories",
    isOwn: false,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B08WALLET01", seller_id: "AMZN_SELLER_004", basePrice: 34.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098768", seller_id: "ebay_leathercraft", basePrice: 29.00, shipping: 2.99 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891237", seller_id: "slimcarry.myshopify.com", basePrice: 38.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234570", seller_id: "LeatherArtisanCo", basePrice: 42.00, shipping: 3.50 },
    ],
  },
  {
    name: "Smart LED Desk Lamp",
    category: "Home Office",
    isOwn: false,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B09LAMP0001", seller_id: "AMZN_SELLER_005", basePrice: 39.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098769", seller_id: "ebay_lightmaster", basePrice: 35.50, shipping: 5.00 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891238", seller_id: "luminos.myshopify.com", basePrice: 44.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234571", seller_id: "GlowDesignStudio", basePrice: 48.00, shipping: 6.00 },
    ],
  },
  {
    name: "Stainless Steel Water Bottle",
    category: "Lifestyle",
    isOwn: false,
    entries: [
      { platform: "amazon" as Platform, platformProductId: "B08BOTTLE01", seller_id: "AMZN_SELLER_006", basePrice: 24.99, shipping: 0 },
      { platform: "ebay" as Platform, platformProductId: "334521098770", seller_id: "ebay_hydration", basePrice: 21.00, shipping: 3.50 },
      { platform: "shopify" as Platform, platformProductId: "shopify_prod_7891239", seller_id: "pureflow.myshopify.com", basePrice: 27.00, shipping: 0 },
      { platform: "etsy" as Platform, platformProductId: "etsy_listing_1234572", seller_id: "EcoSipCo", basePrice: 29.50, shipping: 4.00 },
    ],
  },
];

function jitter(base: number, pct: number): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

function randomAvailability(): "in_stock" | "out_of_stock" | "limited" {
  const r = Math.random();
  if (r < 0.75) return "in_stock";
  if (r < 0.90) return "limited";
  return "out_of_stock";
}

async function seed() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL!);
  const db = drizzle(connection);

  console.log("🌱 Seeding price intelligence data...");

  // Clear existing data
  await db.delete(alertEvents);
  await db.delete(alertRules);
  await db.delete(priceSnapshots);
  await db.delete(trackedProducts);
  await db.delete(marginRules);

  // Insert margin rules
  await db.insert(marginRules).values({
    minMarginPct: "15",
    targetMarginPct: "25",
    cogPerUnit: "32",
    platformFeePct: "12",
    shippingCost: "5",
  });
  console.log("  ✓ Margin rules inserted");

  // Insert tracked products and generate price history
  const productIds: number[] = [];

  for (const product of PRODUCTS) {
    for (const entry of product.entries) {
      const [result] = await db.insert(trackedProducts).values({
        name: product.name,
        platformProductId: entry.platformProductId,
        platform: entry.platform,
        productUrl: `https://${entry.platform}.com/product/${entry.platformProductId}`,
        category: product.category,
        isOwn: product.isOwn,
      });
      const productId = (result as any).insertId as number;
      productIds.push(productId);

      // Generate 30 days of daily price history with realistic drift
      const snapshots = [];
      let currentPrice = entry.basePrice;
      const now = Date.now();

      for (let day = 29; day >= 0; day--) {
        // Simulate price drift: small daily changes with occasional bigger moves
        const driftPct = Math.random() < 0.15 ? 0.08 : 0.02;
        currentPrice = jitter(currentPrice, driftPct);
        currentPrice = Math.max(currentPrice, entry.basePrice * 0.7); // floor at -30%
        currentPrice = Math.min(currentPrice, entry.basePrice * 1.4); // cap at +40%

        const shippingPrice = entry.shipping;
        const landedPrice = Math.round((currentPrice + shippingPrice) * 100) / 100;
        const capturedAt = new Date(now - day * 24 * 60 * 60 * 1000);

        snapshots.push({
          trackedProductId: productId,
          platform: entry.platform,
          current_price: currentPrice.toFixed(2),
          shipping_price: shippingPrice.toFixed(2),
          landed_price: landedPrice.toFixed(2),
          availability: randomAvailability(),
          seller_id: entry.seller_id,
          currency: "USD",
          captured_at: capturedAt,
        });
      }

      // Batch insert snapshots
      for (let i = 0; i < snapshots.length; i += 10) {
        await db.insert(priceSnapshots).values(snapshots.slice(i, i + 10) as any);
      }
    }
  }
  console.log(`  ✓ ${PRODUCTS.length} products × ${PLATFORMS.length} platforms inserted`);
  console.log(`  ✓ ${PRODUCTS.length * PLATFORMS.length * 30} price snapshots generated`);

  // Insert alert rules for the first 3 products (first entry of each)
  const alertProductIds = productIds.slice(0, 12); // first 3 products × 4 platforms
  for (const pid of alertProductIds.slice(0, 4)) {
    await db.insert(alertRules).values({
      trackedProductId: pid,
      thresholdPct: "5",
      direction: "any",
      isActive: true,
    });
  }

  // Insert some sample alert events
  const sampleAlerts = [
    { alertRuleId: 1, trackedProductId: productIds[0]!, platform: "amazon" as const, previousPrice: "89.99", currentPrice: "82.50", changePct: "-8.32", direction: "down" as const, isRead: false, triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    { alertRuleId: 2, trackedProductId: productIds[1]!, platform: "ebay" as const, previousPrice: "84.50", currentPrice: "91.00", changePct: "7.69", direction: "up" as const, isRead: false, triggeredAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
    { alertRuleId: 3, trackedProductId: productIds[2]!, platform: "shopify" as const, previousPrice: "92.00", currentPrice: "85.00", changePct: "-7.61", direction: "down" as const, isRead: true, triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    { alertRuleId: 4, trackedProductId: productIds[3]!, platform: "etsy" as const, previousPrice: "97.00", currentPrice: "104.00", changePct: "7.22", direction: "up" as const, isRead: true, triggeredAt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
  ];
  await db.insert(alertEvents).values(sampleAlerts as any);
  console.log("  ✓ Alert rules and events inserted");

  console.log("✅ Seed complete!");
  await connection.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
