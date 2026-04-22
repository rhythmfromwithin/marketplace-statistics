import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  alertEvents,
  alertRules,
  InsertAlertRule,
  InsertTrackedProduct,
  marginRules,
  priceSnapshots,
  trackedProducts,
  type InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const dbPath = process.env.DATABASE_URL.replace("file:", "");
      const sqlite = new Database(dbPath);
      _db = drizzle(sqlite);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onConflictDoUpdate({
    target: users.openId,
    set: updateSet,
  });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── Tracked Products ─────────────────────────────────────────────────────────
export async function getAllTrackedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trackedProducts).orderBy(desc(trackedProducts.createdAt));
}

export async function addTrackedProduct(data: InsertTrackedProduct) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(trackedProducts).values(data).returning({ id: trackedProducts.id });
  return result[0].id;
}

export async function removeTrackedProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(priceSnapshots).where(eq(priceSnapshots.trackedProductId, id));
  await db.delete(alertRules).where(eq(alertRules.trackedProductId, id));
  await db.delete(alertEvents).where(eq(alertEvents.trackedProductId, id));
  await db.delete(trackedProducts).where(eq(trackedProducts.id, id));
}

// ─── Price Snapshots ──────────────────────────────────────────────────────────
export async function getLatestSnapshotPerProduct() {
  const db = await getDb();
  if (!db) return [];
  // Get the most recent snapshot for each (trackedProductId, platform) pair
  const rows = db.all(sql`
    SELECT ps.*
    FROM price_snapshots ps
    INNER JOIN (
      SELECT trackedProductId, platform, MAX(captured_at) AS max_captured
      FROM price_snapshots
      GROUP BY trackedProductId, platform
    ) latest ON ps.trackedProductId = latest.trackedProductId
      AND ps.platform = latest.platform
      AND ps.captured_at = latest.max_captured
    ORDER BY ps.trackedProductId, ps.platform
  `) as Array<{
    id: number;
    trackedProductId: number;
    platform: string;
    current_price: string;
    shipping_price: string;
    landed_price: string;
    availability: string;
    seller_id: string | null;
    currency: string;
    captured_at: Date;
  }>;
  return rows;
}

export async function getPreviousSnapshot(trackedProductId: number, platform: string) {
  const db = await getDb();
  if (!db) return null;
  // Get the second-most-recent snapshot
  const rows = await db
    .select()
    .from(priceSnapshots)
    .where(
      and(
        eq(priceSnapshots.trackedProductId, trackedProductId),
        eq(priceSnapshots.platform, platform as any)
      )
    )
    .orderBy(desc(priceSnapshots.captured_at))
    .limit(2);
  return rows[1] ?? null;
}

export async function getPriceHistory(trackedProductId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(priceSnapshots)
    .where(
      and(
        eq(priceSnapshots.trackedProductId, trackedProductId),
        gte(priceSnapshots.captured_at, since)
      )
    )
    .orderBy(priceSnapshots.captured_at);
}

export async function insertPriceSnapshot(data: {
  trackedProductId: number;
  platform: string;
  current_price: number;
  shipping_price: number;
  landed_price: number;
  availability: "in_stock" | "out_of_stock" | "limited";
  seller_id?: string;
  currency?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(priceSnapshots).values({
    ...data,
    platform: data.platform as any,
    current_price: data.current_price.toFixed(2),
    shipping_price: data.shipping_price.toFixed(2),
    landed_price: data.landed_price.toFixed(2),
    currency: data.currency ?? "USD",
    captured_at: new Date(),
  } as any);
}

// ─── Alert Rules ──────────────────────────────────────────────────────────────
export async function getAlertRules() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertRules).orderBy(desc(alertRules.createdAt));
}

export async function createAlertRule(data: InsertAlertRule) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(alertRules).values(data).returning({ id: alertRules.id });
  return result[0].id;
}

export async function deleteAlertRule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(alertRules).where(eq(alertRules.id, id));
}

export async function toggleAlertRule(id: number, isActive: boolean) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(alertRules).set({ isActive }).where(eq(alertRules.id, id));
}

// ─── Alert Events ─────────────────────────────────────────────────────────────
export async function getAlertEvents(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alertEvents).orderBy(desc(alertEvents.triggeredAt)).limit(limit);
}

export async function markAlertRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(alertEvents).set({ isRead: true }).where(eq(alertEvents.id, id));
}

export async function markAllAlertsRead() {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(alertEvents).set({ isRead: true });
}

export async function insertAlertEvent(data: {
  alertRuleId: number;
  trackedProductId: number;
  platform: string;
  previousPrice: number;
  currentPrice: number;
  changePct: number;
  direction: "up" | "down";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(alertEvents).values({
    ...data,
    platform: data.platform as any,
    previousPrice: data.previousPrice.toFixed(2),
    currentPrice: data.currentPrice.toFixed(2),
    changePct: data.changePct.toFixed(2),
    triggeredAt: new Date(),
  } as any);
}

// ─── Margin Rules ─────────────────────────────────────────────────────────────
export async function getMarginRules() {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(marginRules).limit(1);
  return rows[0] ?? null;
}

export async function upsertMarginRules(data: {
  minMarginPct: number;
  targetMarginPct: number;
  cogPerUnit: number;
  platformFeePct: number;
  shippingCost: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const existing = await getMarginRules();
  if (existing) {
    await db.update(marginRules).set({
      minMarginPct: data.minMarginPct.toFixed(2),
      targetMarginPct: data.targetMarginPct.toFixed(2),
      cogPerUnit: data.cogPerUnit.toFixed(2),
      platformFeePct: data.platformFeePct.toFixed(2),
      shippingCost: data.shippingCost.toFixed(2),
    } as any);
  } else {
    await db.insert(marginRules).values({
      minMarginPct: data.minMarginPct.toFixed(2),
      targetMarginPct: data.targetMarginPct.toFixed(2),
      cogPerUnit: data.cogPerUnit.toFixed(2),
      platformFeePct: data.platformFeePct.toFixed(2),
      shippingCost: data.shippingCost.toFixed(2),
    } as any);
  }
}
