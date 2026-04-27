import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Tracked Products ─────────────────────────────────────────────────────────
export const trackedProducts = sqliteTable("tracked_products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Human-readable product name */
  name: text("name", { length: 255 }).notNull(),
  /** Platform-native product identifier (ASIN, itemId, product.id, listing_id) */
  platformProductId: text("platformProductId", { length: 255 }).notNull(),
  platform: text("platform", { enum: ["amazon", "ebay", "shopify", "etsy"] }).notNull(),
  /** Optional URL for direct reference */
  productUrl: text("productUrl"),
  /** Category for grouping */
  category: text("category", { length: 128 }),
  /** Whether this is "my" product (used for recommendation engine) */
  isOwn: integer("isOwn", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type TrackedProduct = typeof trackedProducts.$inferSelect;
export type InsertTrackedProduct = typeof trackedProducts.$inferInsert;

// ─── Price Snapshots (Compatibility Layer) ────────────────────────────────────
export const priceSnapshots = sqliteTable("price_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackedProductId: integer("trackedProductId").notNull(),
  platform: text("platform", { enum: ["amazon", "ebay", "shopify", "etsy"] }).notNull(),
  /** Normalized field: current listing price (stored as text for precision) */
  current_price: text("current_price").notNull(),
  /** Normalized field: shipping cost (0 if free) */
  shipping_price: text("shipping_price").notNull().default("0"),
  /** Normalized field: current_price + shipping_price */
  landed_price: text("landed_price").notNull(),
  /** Normalized field: in_stock | out_of_stock | limited */
  availability: text("availability", { enum: ["in_stock", "out_of_stock", "limited"] }).notNull().default("in_stock"),
  /** Normalized field: platform-native seller identifier */
  seller_id: text("seller_id", { length: 255 }),
  /** ISO 4217 currency code */
  currency: text("currency", { length: 8 }).notNull().default("USD"),
  /** Timestamp when this price was captured */
  captured_at: integer("captured_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type InsertPriceSnapshot = typeof priceSnapshots.$inferInsert;

// ─── Alert Rules ──────────────────────────────────────────────────────────────
export const alertRules = sqliteTable("alert_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackedProductId: integer("trackedProductId").notNull(),
  /** Percentage threshold (e.g. 5 = alert when price changes by ≥5%) */
  thresholdPct: text("thresholdPct").notNull().default("5"),
  /** Alert when price goes up, down, or either */
  direction: text("direction", { enum: ["up", "down", "any"] }).notNull().default("any"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = typeof alertRules.$inferInsert;

// ─── Alert Events (triggered alerts log) ─────────────────────────────────────
export const alertEvents = sqliteTable("alert_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  alertRuleId: integer("alertRuleId").notNull(),
  trackedProductId: integer("trackedProductId").notNull(),
  platform: text("platform", { enum: ["amazon", "ebay", "shopify", "etsy"] }).notNull(),
  previousPrice: text("previousPrice").notNull(),
  currentPrice: text("currentPrice").notNull(),
  changePct: text("changePct").notNull(),
  direction: text("direction", { enum: ["up", "down"] }).notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  triggeredAt: integer("triggeredAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type AlertEvent = typeof alertEvents.$inferSelect;
export type InsertAlertEvent = typeof alertEvents.$inferInsert;

// ─── Margin Rules ─────────────────────────────────────────────────────────────
export const marginRules = sqliteTable("margin_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackedProductId: integer("trackedProductId").notNull().unique(),
  /** Target margin percentage (e.g. 30 = 30% margin) */
  targetMarginPct: text("targetMarginPct").notNull().default("30"),
  /** Minimum acceptable price */
  minPrice: text("minPrice"),
  /** Maximum acceptable price */
  maxPrice: text("maxPrice"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type MarginRule = typeof marginRules.$inferSelect;
export type InsertMarginRule = typeof marginRules.$inferInsert;

// ─── User Feedback ────────────────────────────────────────────────────────────
export const userFeedback = sqliteTable("user_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }),
  email: text("email", { length: 320 }),
  category: text("category", { enum: ["bug", "feature", "general"] }).notNull().default("general"),
  message: text("message").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// ─── Sales Estimates ──────────────────────────────────────────────────────────
export const salesEstimates = sqliteTable("sales_estimates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackedProductId: integer("trackedProductId").notNull(),
  platform: text("platform", { enum: ["amazon", "ebay", "shopify", "etsy"] }).notNull(),
  /** Estimated daily sales volume */
  estimatedDailySales: integer("estimatedDailySales"),
  /** Estimated monthly sales volume */
  estimatedMonthlySales: integer("estimatedMonthlySales"),
  /** Best Seller Rank */
  bsr: integer("bsr"),
  /** BSR category (e.g., "Electronics", "Home & Kitchen") */
  bsrCategory: text("bsrCategory", { length: 255 }),
  /** Total review count */
  reviewCount: integer("reviewCount"),
  /** Review growth rate (reviews per day) */
  reviewGrowthRate: real("reviewGrowthRate"),
  /** Estimation method: bsr, review, or combined */
  estimationMethod: text("estimationMethod", { enum: ["bsr", "review", "combined"] }).notNull(),
  /** Confidence score (0-100) */
  confidence: integer("confidence").notNull(),
  /** Additional metadata stored as JSON string */
  metadata: text("metadata"),
  /** Timestamp when estimation was performed */
  estimatedAt: integer("estimatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type SalesEstimate = typeof salesEstimates.$inferSelect;
export type InsertSalesEstimate = typeof salesEstimates.$inferInsert;

// ─── BSR Conversion Rules ─────────────────────────────────────────────────────
export const bsrConversionRules = sqliteTable("bsr_conversion_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Product category (e.g., "Electronics", "Home & Kitchen") */
  category: text("category", { length: 255 }).notNull(),
  /** Marketplace identifier (e.g., "amazon.com", "amazon.co.uk") */
  marketplace: text("marketplace", { length: 64 }).notNull(),
  /** Minimum BSR in this range */
  bsrMin: integer("bsrMin").notNull(),
  /** Maximum BSR in this range */
  bsrMax: integer("bsrMax").notNull(),
  /** Minimum estimated daily sales for this BSR range */
  dailySalesMin: integer("dailySalesMin").notNull(),
  /** Maximum estimated daily sales for this BSR range */
  dailySalesMax: integer("dailySalesMax").notNull(),
  /** Confidence score for this conversion rule (0-100) */
  confidence: integer("confidence").notNull().default(50),
  /** Data source (e.g., "jungle_scout", "helium10", "manual") */
  source: text("source", { length: 128 }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export type BsrConversionRule = typeof bsrConversionRules.$inferSelect;
export type InsertBsrConversionRule = typeof bsrConversionRules.$inferInsert;
