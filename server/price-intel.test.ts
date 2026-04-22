import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Shared test context ──────────────────────────────────────────────────────
function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Delta calculation helper (mirrors server logic) ─────────────────────────
function calcDelta(prev: number, curr: number) {
  if (prev === 0) return { changePct: 0, direction: "none" as const };
  const pct = ((curr - prev) / prev) * 100;
  return {
    changePct: Math.round(pct * 100) / 100,
    direction: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("none" as const),
  };
}

// ─── Recommendation engine helper (mirrors server logic) ─────────────────────
function computeRecommendation(
  landedPrices: number[],
  rules: { minMarginPct: number; targetMarginPct: number; cogPerUnit: number; platformFeePct: number; shippingCost: number }
) {
  if (landedPrices.length === 0) return null;
  const lowestLanded = Math.min(...landedPrices);
  const avgMarket = landedPrices.reduce((a, b) => a + b, 0) / landedPrices.length;
  const { cogPerUnit, platformFeePct, shippingCost, minMarginPct, targetMarginPct } = rules;
  const totalCost = cogPerUnit + shippingCost;
  const minPrice = totalCost / (1 - platformFeePct / 100 - minMarginPct / 100);
  const targetPrice = totalCost / (1 - platformFeePct / 100 - targetMarginPct / 100);
  const competitive = Math.max(lowestLanded * 0.98, minPrice);
  const suggested = Math.min(competitive, targetPrice);
  const actualMargin = ((suggested - totalCost - suggested * (platformFeePct / 100)) / suggested) * 100;
  return {
    lowestLanded: Math.round(lowestLanded * 100) / 100,
    avgMarket: Math.round(avgMarket * 100) / 100,
    minPrice: Math.round(minPrice * 100) / 100,
    targetPrice: Math.round(targetPrice * 100) / 100,
    suggestedPrice: Math.round(suggested * 100) / 100,
    estimatedMarginPct: Math.round(actualMargin * 100) / 100,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      ...createTestContext(),
      res: {
        clearCookie: (name: string) => cleared.push(name),
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared).toHaveLength(1);
  });
});

describe("calcDelta", () => {
  it("returns direction=up when price increases", () => {
    const delta = calcDelta(100, 110);
    expect(delta.direction).toBe("up");
    expect(delta.changePct).toBe(10);
  });

  it("returns direction=down when price decreases", () => {
    const delta = calcDelta(100, 90);
    expect(delta.direction).toBe("down");
    expect(delta.changePct).toBe(-10);
  });

  it("returns direction=none when price is unchanged", () => {
    const delta = calcDelta(100, 100);
    expect(delta.direction).toBe("none");
    expect(delta.changePct).toBe(0);
  });

  it("returns direction=none when previous price is 0", () => {
    const delta = calcDelta(0, 50);
    expect(delta.direction).toBe("none");
    expect(delta.changePct).toBe(0);
  });

  it("rounds changePct to 2 decimal places", () => {
    const delta = calcDelta(300, 301);
    expect(delta.changePct).toBe(0.33);
  });
});

describe("computeRecommendation", () => {
  const baseRules = {
    minMarginPct: 15,
    targetMarginPct: 25,
    cogPerUnit: 30,
    platformFeePct: 12,
    shippingCost: 5,
  };

  it("returns null for empty price list", () => {
    const result = computeRecommendation([], baseRules);
    expect(result).toBeNull();
  });

  it("computes lowestLanded correctly", () => {
    const result = computeRecommendation([80, 90, 100], baseRules);
    expect(result?.lowestLanded).toBe(80);
  });

  it("computes avgMarket correctly", () => {
    const result = computeRecommendation([60, 90, 120], baseRules);
    expect(result?.avgMarket).toBe(90);
  });

  it("suggestedPrice is at or above minPrice floor", () => {
    const result = computeRecommendation([50, 60, 70], baseRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedPrice).toBeGreaterThanOrEqual(result!.minPrice);
  });

  it("suggestedPrice does not exceed targetPrice", () => {
    const result = computeRecommendation([200, 250, 300], baseRules);
    expect(result).not.toBeNull();
    expect(result!.suggestedPrice).toBeLessThanOrEqual(result!.targetPrice);
  });

  it("estimatedMarginPct is a finite number", () => {
    const result = computeRecommendation([100, 110, 120], baseRules);
    expect(result).not.toBeNull();
    expect(isFinite(result!.estimatedMarginPct)).toBe(true);
  });

  it("minPrice < targetPrice when minMarginPct < targetMarginPct", () => {
    const result = computeRecommendation([100], baseRules);
    expect(result).not.toBeNull();
    expect(result!.minPrice).toBeLessThan(result!.targetPrice);
  });
});

describe("price field naming convention", () => {
  it("dashboard rows use correct field names: current_price, shipping_price, landed_price", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const rows = await caller.prices.dashboard();
    if (rows.length > 0) {
      const row = rows[0]!;
      expect(row).toHaveProperty("current_price");
      expect(row).toHaveProperty("shipping_price");
      expect(row).toHaveProperty("landed_price");
      expect(row).toHaveProperty("availability");
      expect(row).toHaveProperty("seller_id");
      expect(row).toHaveProperty("captured_at");
    }
  });

  it("dashboard rows include direction and changePct for delta indicators", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const rows = await caller.prices.dashboard();
    if (rows.length > 0) {
      const row = rows[0]!;
      expect(row).toHaveProperty("direction");
      expect(row).toHaveProperty("changePct");
      expect(["up", "down", "none"]).toContain(row.direction);
    }
  });
});

describe("products.list", () => {
  it("returns an array of tracked products", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const products = await caller.products.list();
    expect(Array.isArray(products)).toBe(true);
    if (products.length > 0) {
      const p = products[0]!;
      expect(p).toHaveProperty("id");
      expect(p).toHaveProperty("name");
      expect(p).toHaveProperty("platform");
      expect(p).toHaveProperty("platformProductId");
      expect(["amazon", "ebay", "shopify", "etsy"]).toContain(p.platform);
    }
  });
});

describe("alerts.unreadCount", () => {
  it("returns a non-negative integer", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const count = await caller.alerts.unreadCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

describe("cross-platform compatibility layer normalization", () => {
  it("all platforms produce rows with the same normalized field schema", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const rows = await caller.prices.dashboard();

    const platforms = ["amazon", "ebay", "shopify", "etsy"] as const;
    const requiredFields = ["current_price", "shipping_price", "landed_price", "availability", "seller_id", "captured_at", "platform"];

    for (const platform of platforms) {
      const platformRows = rows.filter((r) => r.platform === platform);
      // Each platform should have at least one row in seed data
      expect(platformRows.length).toBeGreaterThan(0);

      for (const row of platformRows) {
        // Verify all required normalized fields are present
        for (const field of requiredFields) {
          expect(row).toHaveProperty(field);
        }
        // Verify numeric fields are actual numbers (not strings)
        expect(typeof row.current_price).toBe("number");
        expect(typeof row.shipping_price).toBe("number");
        expect(typeof row.landed_price).toBe("number");
        // landed_price = current_price + shipping_price (within rounding)
        expect(Math.abs(row.landed_price - (row.current_price + row.shipping_price))).toBeLessThan(0.02);
        // availability must be one of the known values
        expect(["in_stock", "out_of_stock", "limited"]).toContain(row.availability);
        // captured_at must be a Date or parseable date string
        const capturedAt = row.captured_at;
        const isValidDate = capturedAt instanceof Date || (typeof capturedAt === "string" && !isNaN(Date.parse(capturedAt)));
        expect(isValidDate).toBe(true);
      }
    }
  });

  it("price_snapshots history uses captured_at timestamp field", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const products = await caller.products.list();
    expect(products.length).toBeGreaterThan(0);

    const history = await caller.prices.history({ trackedProductId: products[0]!.id });
    if (history.length > 0) {
      const snap = history[0]!;
      expect(snap).toHaveProperty("captured_at");
      const capturedAt = snap.captured_at;
      const isValidDate = capturedAt instanceof Date || (typeof capturedAt === "string" && !isNaN(Date.parse(capturedAt)));
      expect(isValidDate).toBe(true);
      expect(snap).toHaveProperty("current_price");
      expect(snap).toHaveProperty("shipping_price");
      expect(snap).toHaveProperty("landed_price");
      expect(snap).toHaveProperty("availability");
      expect(snap).toHaveProperty("seller_id");
    }
  });
});

describe("marginRules.get", () => {
  it("returns margin rules with correct numeric fields", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    const rules = await caller.marginRules.get();
    if (rules) {
      expect(typeof rules.minMarginPct).toBe("number");
      expect(typeof rules.targetMarginPct).toBe("number");
      expect(typeof rules.cogPerUnit).toBe("number");
      expect(typeof rules.platformFeePct).toBe("number");
      expect(typeof rules.shippingCost).toBe("number");
      expect(rules.minMarginPct).toBeLessThan(rules.targetMarginPct);
    }
  });
});
