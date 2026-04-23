import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { randomInt } from "crypto";
import { z } from "zod";
import {
  addTrackedProduct,
  consumeAuthVerificationCode,
  createAuthVerificationCode,
  createUserFeedback,
  createAlertRule,
  deleteAlertRule,
  getAlertEvents,
  getAlertRules,
  getAllTrackedProducts,
  getAuthVerificationLogs,
  getLatestSnapshotPerProduct,
  getUserByOpenId,
  getMarginRules,
  getPriceHistory,
  getPreviousSnapshot,
  getUserByEmail,
  getUserByPhone,
  insertAlertEvent,
  insertPriceSnapshot,
  markAlertRead,
  markAllAlertsRead,
  removeTrackedProduct,
  toggleAlertRule,
  upsertUser,
  upsertMarginRules,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { platformManager } from "./platforms/index";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function calcDelta(prev: number, curr: number) {
  if (prev === 0) return { changePct: 0, direction: "none" as const };
  const pct = ((curr - prev) / prev) * 100;
  return {
    changePct: Math.round(pct * 100) / 100,
    direction: pct > 0 ? ("up" as const) : pct < 0 ? ("down" as const) : ("none" as const),
  };
}

function jitter(base: number, pct: number): number {
  const delta = base * pct * (Math.random() * 2 - 1);
  return Math.round((base + delta) * 100) / 100;
}

function extractAmazonAsinFromUrl(raw: string): string {
  const value = normalizePotentialAmazonUrl(raw);
  if (!value) throw new TRPCError({ code: "BAD_REQUEST", message: "Amazon URL is required" });

  // Allow direct ASIN input as a fallback.
  if (/^[A-Z0-9]{10}$/i.test(value)) return value.toUpperCase();

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid Amazon URL format" });
  }

  if (!parsed.hostname.toLowerCase().includes("amazon.")) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "URL must be an Amazon product link" });
  }

  const path = parsed.pathname;
  const patterns = [
    /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
    /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
  ];
  for (const pattern of patterns) {
    const match = path.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }

  const byParam = parsed.searchParams.get("asin");
  if (byParam && /^[A-Z0-9]{10}$/i.test(byParam)) return byParam.toUpperCase();

  throw new TRPCError({ code: "BAD_REQUEST", message: "Could not extract ASIN from Amazon URL" });
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function buildOpenIdFromPhone(phone: string) {
  return `phone_${phone}`;
}

function buildOpenIdFromEmail(email: string) {
  return `gmail_${email.replace(/[^a-z0-9]/g, "_")}`.slice(0, 64);
}

function toCsvCell(value: unknown): string {
  const raw = value == null ? "" : String(value);
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function normalizePotentialAmazonUrl(value: string): string {
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^amazon\./i.test(trimmed) || /^www\.amazon\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function extractAmazonStoreIdFromUrl(raw: string): string | null {
  const normalized = normalizePotentialAmazonUrl(raw);
  try {
    const parsed = new URL(normalized);
    if (!parsed.hostname.toLowerCase().includes("amazon.")) return null;
    const byParam = parsed.searchParams.get("seller");
    if (byParam) return byParam.trim();
    return null;
  } catch {
    return null;
  }
}

function extractAmazonReference(text: string): { kind: "asin" | "url"; value: string } | null {
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?amazon\.[^\s]+/i);
  if (urlMatch?.[0]) {
    const cleaned = urlMatch[0].replace(/[),.;!?]+$/, "");
    return { kind: "url", value: normalizePotentialAmazonUrl(cleaned) };
  }

  const asinMatch = text.match(/\b[A-Z0-9]{10}\b/i);
  if (asinMatch?.[0]) {
    return { kind: "asin", value: asinMatch[0].toUpperCase() };
  }

  return null;
}

async function addAmazonTrackedProductFromUrl(input: {
  url: string;
  category?: string;
  isOwn?: boolean;
}) {
  const asin = extractAmazonAsinFromUrl(normalizePotentialAmazonUrl(input.url));

  const existing = (await getAllTrackedProducts()).find(
    (p) => p.platform === "amazon" && p.platformProductId.toUpperCase() === asin
  );
  if (existing) {
    return {
      id: existing.id,
      asin,
      name: existing.name,
      alreadyExists: true,
      currentPrice: null as number | null,
      shippingPrice: null as number | null,
      landedPrice: null as number | null,
    };
  }

  const api = platformManager.getPlatformAPI("amazon");
  const priceData = await api.getPrice(asin);
  const name = priceData.title?.trim() || `Amazon Product ${asin}`;

  const id = await addTrackedProduct({
    name,
    platformProductId: asin,
    platform: "amazon",
    productUrl: input.url,
    category: input.category,
    isOwn: input.isOwn ?? false,
  });

  await insertPriceSnapshot({
    trackedProductId: id,
    platform: "amazon",
    current_price: priceData.currentPrice,
    shipping_price: priceData.shippingPrice,
    landed_price: priceData.landedPrice,
    availability: priceData.availability,
    seller_id: priceData.sellerId,
  });

  return {
    id,
    asin,
    name,
    alreadyExists: false,
    currentPrice: priceData.currentPrice,
    shippingPrice: priceData.shippingPrice,
    landedPrice: priceData.landedPrice,
  };
}

async function addAmazonProductsFromStoreUrl(url: string, limit: number = 5) {
  const storeId = extractAmazonStoreIdFromUrl(url);
  if (!storeId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Could not extract seller/store id from URL" });
  }

  const api = platformManager.getPlatformAPI("amazon");
  const searchResults = await api.search(storeId, limit);
  const picked = searchResults.filter((item) => !!item.platformProductId).slice(0, limit);

  if (picked.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "No products found for this store URL" });
  }

  const added = [];
  for (const item of picked) {
    const result = await addAmazonTrackedProductFromUrl({
      url: item.productUrl || item.platformProductId,
      category: "competitor-store",
      isOwn: false,
    });
    added.push(result);
  }

  return { storeId, added };
}

// ─── Recommendation engine ────────────────────────────────────────────────────
function computeRecommendation(
  landedPrices: number[],
  rules: { minMarginPct: number; targetMarginPct: number; cogPerUnit: number; platformFeePct: number; shippingCost: number }
) {
  if (landedPrices.length === 0) return null;
  const lowestLanded = Math.min(...landedPrices);
  const avgMarket = landedPrices.reduce((a, b) => a + b, 0) / landedPrices.length;

  const { cogPerUnit, platformFeePct, shippingCost, minMarginPct, targetMarginPct } = rules;
  const totalCost = cogPerUnit + shippingCost;

  // Minimum price to achieve minMarginPct after platform fee
  const minPrice = totalCost / (1 - platformFeePct / 100 - minMarginPct / 100);
  // Target price for targetMarginPct
  const targetPrice = totalCost / (1 - platformFeePct / 100 - targetMarginPct / 100);

  // Suggested: slightly below lowest competitor but above min price floor
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

// ─── Router ───────────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    requestVerificationCode: publicProcedure
      .input(
        z.object({
          method: z.enum(["phone", "gmail"]),
          target: z.string().min(3).max(320),
          purpose: z.enum(["register", "login"]).default("login"),
        })
      )
      .mutation(async ({ input }) => {
        const targetValue =
          input.method === "phone" ? normalizePhone(input.target) : normalizeEmail(input.target);

        if (input.method === "phone" && targetValue.length < 7) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid phone number" });
        }
        if (
          input.method === "gmail" &&
          !/^[^\s@]+@gmail\.com$/i.test(targetValue)
        ) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only Gmail is supported here" });
        }

        const verificationCode = String(randomInt(100000, 1000000));
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await createAuthVerificationCode({
          targetType: input.method,
          targetValue,
          verificationCode,
          purpose: input.purpose,
          expiresAt,
        });

        return {
          success: true,
          // MVP: return code for quick testing; can be removed when SMS/Email provider is connected.
          verificationCode,
          expiresAt,
        };
      }),
    verifyCodeAndSignIn: publicProcedure
      .input(
        z.object({
          method: z.enum(["phone", "gmail"]),
          target: z.string().min(3).max(320),
          code: z.string().min(4).max(16),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const targetValue =
          input.method === "phone" ? normalizePhone(input.target) : normalizeEmail(input.target);
        const consumed = await consumeAuthVerificationCode({
          targetType: input.method,
          targetValue,
          verificationCode: input.code.trim(),
        });
        if (!consumed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification code" });
        }

        let user =
          input.method === "phone"
            ? await getUserByPhone(targetValue)
            : await getUserByEmail(targetValue);

        if (!user) {
          const openId =
            input.method === "phone"
              ? buildOpenIdFromPhone(targetValue)
              : buildOpenIdFromEmail(targetValue);
          await upsertUser({
            openId,
            phone: input.method === "phone" ? targetValue : null,
            email: input.method === "gmail" ? targetValue : null,
            loginMethod: input.method,
            name: null,
            lastSignedIn: new Date(),
          });
          user = await getUserByOpenId(openId);
        } else {
          await upsertUser({
            openId: user.openId,
            phone: input.method === "phone" ? targetValue : user.phone,
            email: input.method === "gmail" ? targetValue : user.email,
            loginMethod: input.method,
            lastSignedIn: new Date(),
          });
        }

        if (!user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),
    getGoogleSsoUrl: publicProcedure.query(() => {
      const portal = process.env.VITE_OAUTH_PORTAL_URL;
      const appId = ENV.appId;
      if (!portal || !appId) return { url: null };
      const redirectUri = `${ENV.oAuthServerUrl || ""}/api/oauth/callback`;
      const state = Buffer.from(redirectUri || "/").toString("base64");
      const url = new URL(`${portal}/app-auth`);
      url.searchParams.set("appId", appId);
      url.searchParams.set("redirectUri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("type", "signIn");
      url.searchParams.set("platform", "google");
      return { url: url.toString() };
    }),
    exportVerificationCsv: adminProcedure.query(async () => {
      const logs = await getAuthVerificationLogs(5000);
      const header = [
        "id",
        "targetType",
        "targetValue",
        "verificationCode",
        "purpose",
        "createdAt",
        "expiresAt",
        "consumedAt",
      ];
      const rows = logs.map((row) =>
        [
          row.id,
          row.targetType,
          row.targetValue,
          row.verificationCode,
          row.purpose,
          row.createdAt?.toISOString?.() ?? row.createdAt,
          row.expiresAt?.toISOString?.() ?? row.expiresAt,
          row.consumedAt?.toISOString?.() ?? row.consumedAt ?? "",
        ]
          .map(toCsvCell)
          .join(",")
      );
      return { filename: "auth_verification_logs.csv", csv: [header.join(","), ...rows].join("\n") };
    }),
  }),

  // ─── Products ──────────────────────────────────────────────────────────────
  products: router({
    list: publicProcedure.query(async ({ ctx }) => {
      const rows = await getAllTrackedProducts();
      if (ctx.user) return rows;
      return rows.slice(0, 20);
    }),

    // 跨平台搜索商品（真实 API 集成）
    search: publicProcedure
      .input(
        z.object({
          keyword: z.string().min(1),
          platforms: z.array(z.enum(["ebay", "etsy", "amazon"])).default(["ebay", "etsy"]),
          limit: z.number().min(1).max(50).default(20),
        })
      )
      .query(async ({ input }) => {
        try {
          const results = await platformManager.searchAcrossPlatforms(
            input.keyword,
            input.platforms,
            input.limit
          );
          return results;
        } catch (error) {
          console.error("[products.search] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Search failed",
          });
        }
      }),

    add: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1),
          platformProductId: z.string().min(1),
          platform: z.enum(["amazon", "ebay", "shopify", "etsy"]),
          productUrl: z.string().optional(),
          category: z.string().optional(),
          isOwn: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const id = await addTrackedProduct(input);
        return { id };
      }),

    addFromAmazonUrl: protectedProcedure
      .input(
        z.object({
          url: z.string().min(1),
          category: z.string().optional(),
          isOwn: z.boolean().optional().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const result = await addAmazonTrackedProductFromUrl(input);
        return { id: result.id, alreadyExists: result.alreadyExists };
      }),

    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeTrackedProduct(input.id);
        return { success: true };
      }),
  }),

  // ─── Prices ────────────────────────────────────────────────────────────────
  prices: router({
    dashboard: publicProcedure.query(async ({ ctx }) => {
      const [products, latestSnapshots] = await Promise.all([
        getAllTrackedProducts(),
        getLatestSnapshotPerProduct(),
      ]);

      // Build dashboard rows with delta computation
      const rows = await Promise.all(
        latestSnapshots.map(async (snap) => {
          const prev = await getPreviousSnapshot(snap.trackedProductId, snap.platform);
          const currPrice = parseFloat(snap.current_price);
          const prevPrice = prev ? parseFloat(prev.current_price as any) : currPrice;
          const delta = calcDelta(prevPrice, currPrice);
          const product = products.find((p) => p.id === snap.trackedProductId);

          return {
            snapshotId: snap.id,
            trackedProductId: snap.trackedProductId,
            productName: product?.name ?? "Unknown",
            category: product?.category ?? null,
            isOwn: product?.isOwn ?? false,
            platform: snap.platform,
            current_price: currPrice,
            shipping_price: parseFloat(snap.shipping_price),
            landed_price: parseFloat(snap.landed_price),
            availability: snap.availability,
            seller_id: snap.seller_id,
            currency: snap.currency,
            captured_at: snap.captured_at,
            previousPrice: prevPrice,
            changePct: delta.changePct,
            direction: delta.direction,
          };
        })
      );

      if (ctx.user) return rows;
      return rows.slice(0, 20);
    }),

    history: publicProcedure
      .input(z.object({ trackedProductId: z.number(), days: z.number().optional().default(30) }))
      .query(async ({ input }) => {
        const snaps = await getPriceHistory(input.trackedProductId, input.days);
        return snaps.map((s) => ({
          id: s.id,
          platform: s.platform,
          current_price: parseFloat(s.current_price as any),
          shipping_price: parseFloat(s.shipping_price as any),
          landed_price: parseFloat(s.landed_price as any),
          availability: s.availability,
          seller_id: s.seller_id,
          captured_at: s.captured_at,
        }));
      }),

    poll: protectedProcedure
      .input(z.object({ trackedProductId: z.number() }))
      .mutation(async ({ input }) => {
        // 获取追踪商品信息
        const products = await getAllTrackedProducts();
        const product = products.find((p) => p.id === input.trackedProductId);

        if (!product) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        }

        const triggered: Array<{ platform: string; changePct: number; direction: "up" | "down" }> = [];
        const rules = await getAlertRules();

        try {
          // 调用真实 API 获取最新价格
          const platform = product.platform as "ebay" | "etsy" | "amazon";
          const api = platformManager.getPlatformAPI(platform);
          const priceData = await api.getPrice(product.platformProductId);

          // 获取上一次快照用于对比
          const prevSnapshot = await getPreviousSnapshot(input.trackedProductId, platform);
          const prevPrice = prevSnapshot ? parseFloat(prevSnapshot.current_price as any) : priceData.currentPrice;

          // 插入新快照
          await insertPriceSnapshot({
            trackedProductId: input.trackedProductId,
            platform,
            current_price: priceData.currentPrice,
            shipping_price: priceData.shippingPrice,
            landed_price: priceData.landedPrice,
            availability: priceData.availability,
            seller_id: priceData.sellerId,
          });

          // 检查告警规则
          const delta = calcDelta(prevPrice, priceData.currentPrice);
          if (delta.direction !== "none") {
            const matchingRules = rules.filter(
              (r) =>
                r.trackedProductId === input.trackedProductId &&
                r.isActive &&
                Math.abs(delta.changePct) >= parseFloat(r.thresholdPct as any) &&
                (r.direction === "any" || r.direction === delta.direction)
            );
            for (const rule of matchingRules) {
              await insertAlertEvent({
                alertRuleId: rule.id,
                trackedProductId: input.trackedProductId,
                platform,
                previousPrice: prevPrice,
                currentPrice: priceData.currentPrice,
                changePct: delta.changePct,
                direction: delta.direction as "up" | "down",
              });
              triggered.push({ platform, changePct: delta.changePct, direction: delta.direction as "up" | "down" });
            }
          }

          return { polled: 1, triggered, priceData };
        } catch (error) {
          console.error("[prices.poll] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: error instanceof Error ? error.message : "Failed to poll price",
          });
        }
      }),
  }),

  // ─── Alerts ────────────────────────────────────────────────────────────────
  alerts: router({
    rules: publicProcedure.query(async () => {
      const [rules, products] = await Promise.all([getAlertRules(), getAllTrackedProducts()]);
      return rules.map((r) => ({
        ...r,
        thresholdPct: parseFloat(r.thresholdPct as any),
        productName: products.find((p) => p.id === r.trackedProductId)?.name ?? "Unknown",
        platform: products.find((p) => p.id === r.trackedProductId)?.platform ?? "amazon",
      }));
    }),

    events: publicProcedure.query(async () => {
      const [events, products] = await Promise.all([getAlertEvents(100), getAllTrackedProducts()]);
      return events.map((e) => ({
        ...e,
        previousPrice: parseFloat(e.previousPrice as any),
        currentPrice: parseFloat(e.currentPrice as any),
        changePct: parseFloat(e.changePct as any),
        productName: products.find((p) => p.id === e.trackedProductId)?.name ?? "Unknown",
      }));
    }),

    createRule: publicProcedure
      .input(
        z.object({
          trackedProductId: z.number(),
          thresholdPct: z.number().min(0.1).max(100),
          direction: z.enum(["up", "down", "any"]),
        })
      )
      .mutation(async ({ input }) => {
        const id = await createAlertRule({
          trackedProductId: input.trackedProductId,
          thresholdPct: input.thresholdPct.toFixed(2),
          direction: input.direction,
          isActive: true,
        } as any);
        return { id };
      }),

    deleteRule: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAlertRule(input.id);
        return { success: true };
      }),

    toggleRule: publicProcedure
      .input(z.object({ id: z.number(), isActive: z.boolean() }))
      .mutation(async ({ input }) => {
        await toggleAlertRule(input.id, input.isActive);
        return { success: true };
      }),

    markRead: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markAlertRead(input.id);
        return { success: true };
      }),

    markAllRead: publicProcedure.mutation(async () => {
      await markAllAlertsRead();
      return { success: true };
    }),

    unreadCount: publicProcedure.query(async () => {
      const events = await getAlertEvents(200);
      return events.filter((e) => !e.isRead).length;
    }),
  }),

  // ─── Recommendations ───────────────────────────────────────────────────────
  recommendations: router({
    get: publicProcedure
      .input(z.object({ trackedProductId: z.number() }))
      .query(async ({ input }) => {
        const [snapshots, rules] = await Promise.all([
          getPriceHistory(input.trackedProductId, 1),
          getMarginRules(),
        ]);

        if (!rules) throw new TRPCError({ code: "NOT_FOUND", message: "No margin rules configured" });

        const landedPrices = snapshots.map((s) => parseFloat(s.landed_price as any));
        const rec = computeRecommendation(landedPrices, {
          minMarginPct: parseFloat(rules.minMarginPct as any),
          targetMarginPct: parseFloat(rules.targetMarginPct as any),
          cogPerUnit: parseFloat(rules.cogPerUnit as any),
          platformFeePct: parseFloat(rules.platformFeePct as any),
          shippingCost: parseFloat(rules.shippingCost as any),
        });

        return rec;
      }),

    getAll: publicProcedure.query(async () => {
      const [products, rules] = await Promise.all([getAllTrackedProducts(), getMarginRules()]);
      if (!rules) return [];

      const ownProducts = products.filter((p) => p.isOwn);
      const results = [];

      for (const product of ownProducts) {
        const snapshots = await getPriceHistory(product.id, 1);
        const landedPrices = snapshots.map((s) => parseFloat(s.landed_price as any));
        const rec = computeRecommendation(landedPrices, {
          minMarginPct: parseFloat(rules.minMarginPct as any),
          targetMarginPct: parseFloat(rules.targetMarginPct as any),
          cogPerUnit: parseFloat(rules.cogPerUnit as any),
          platformFeePct: parseFloat(rules.platformFeePct as any),
          shippingCost: parseFloat(rules.shippingCost as any),
        });
        if (rec) results.push({ product, ...rec });
      }

      return results;
    }),
  }),

  // ─── AI Chat ───────────────────────────────────────────────────────────────
  chat: router({
    ask: protectedProcedure
      .input(
        z.object({
          message: z.string().min(1).max(2000),
          history: z
            .array(
              z.object({
                role: z.enum(["user", "assistant"]),
                content: z.string(),
              })
            )
            .max(20)
            .default([]),
        })
      )
      .mutation(async ({ input }) => {
        const reference = extractAmazonReference(input.message);
        if (reference) {
          try {
            if (reference.kind === "url") {
              const storeId = extractAmazonStoreIdFromUrl(reference.value);
              if (storeId) {
                const storeResult = await addAmazonProductsFromStoreUrl(reference.value);
                return {
                  content: `Added ${storeResult.added.length} products from store ${storeResult.storeId} to tracking.`,
                  action: {
                    type: "product_tracked" as const,
                    trackedProductId: storeResult.added[0]?.id ?? null,
                    platform: "amazon" as const,
                    asin: storeResult.added[0]?.asin ?? null,
                    alreadyExists: storeResult.added.every((item) => item.alreadyExists),
                    count: storeResult.added.length,
                  },
                };
              }
            }

            const result = await addAmazonTrackedProductFromUrl({
              url: reference.value,
            });
            const suffix =
              result.currentPrice == null
                ? ""
                : ` Current price: $${result.currentPrice.toFixed(2)}, shipping: $${result.shippingPrice!.toFixed(2)}, landed: $${result.landedPrice!.toFixed(2)}.`;
            return {
              content: result.alreadyExists
                ? `Already tracking this Amazon product (${result.asin}) as "${result.name}".`
                : `Added "${result.name}" (${result.asin}) to tracking.${suffix}`,
              action: {
                type: "product_tracked" as const,
                trackedProductId: result.id,
                platform: "amazon" as const,
                asin: result.asin,
                alreadyExists: result.alreadyExists,
              },
            };
          } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to add product";
            return {
              content: `I found an Amazon reference but couldn't add it yet: ${message}`,
              action: {
                type: "product_tracked" as const,
                trackedProductId: null,
                platform: "amazon" as const,
                asin: null,
                alreadyExists: false,
                error: message,
              },
            };
          }
        }

        // Build live price context from the database
        const [products, snapshots, rules, alertEvents] = await Promise.all([
          getAllTrackedProducts(),
          getLatestSnapshotPerProduct(),
          getMarginRules(),
          getAlertEvents(10),
        ]);

        // Summarize price data for the LLM
        const priceLines = snapshots
          .slice(0, 40)
          .map((s) => {
            const prod = products.find((p) => p.id === s.trackedProductId);
            const landed = parseFloat(s.landed_price as any);
            const curr = parseFloat(s.current_price as any);
            const ship = parseFloat(s.shipping_price as any);
            return `- ${prod?.name ?? "Unknown"} [${s.platform}]: current=$${curr}, shipping=$${ship}, landed=$${landed}, availability=${s.availability}, seller=${s.seller_id}`;
          })
          .join("\n");

        const recentAlerts = alertEvents
          .slice(0, 5)
          .map((e) => {
            const pct = parseFloat(e.changePct as any);
            const prev = parseFloat(e.previousPrice as any);
            const curr = parseFloat(e.currentPrice as any);
            const prod = products.find((p) => p.id === e.trackedProductId);
            return `- ${prod?.name ?? "Unknown"} on ${e.platform}: $${prev.toFixed(2)} → $${curr.toFixed(2)} (${pct > 0 ? "+" : ""}${pct}%)`;
          })
          .join("\n");

        const marginContext = rules
          ? `Margin rules: COGS=$${rules.cogPerUnit}, platform fee=${rules.platformFeePct}%, shipping=$${rules.shippingCost}, min margin=${rules.minMarginPct}%, target margin=${rules.targetMarginPct}%`
          : "No margin rules configured.";

        const systemPrompt = `You are Price Intel AI, an expert pricing analyst assistant embedded in a cross-platform price intelligence tool.

You have real-time access to the following live market data:

## Current Price Snapshots (latest per product/platform)
${priceLines || "No data available"}

## Recent Price Change Alerts
${recentAlerts || "No recent alerts"}

## ${marginContext}

You help users understand competitor pricing, identify opportunities, and make smart pricing decisions. Be concise, specific, and data-driven. When referencing prices, use the actual numbers from the data above. Format currency as $X.XX. Use markdown for structure when helpful.`;

        const messages = [
          { role: "system" as const, content: systemPrompt },
          ...input.history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        const response = await invokeLLM({ messages });
        const rawContent = response.choices?.[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : (rawContent ? JSON.stringify(rawContent) : "I couldn't generate a response. Please try again.");
        return { content, action: null };
      }),
  }),

  feedback: router({
    submit: protectedProcedure
      .input(
        z.object({
          category: z.enum(["bug", "feature", "general"]).default("general"),
          message: z.string().min(5).max(2000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createUserFeedback({
          openId: ctx.user?.openId ?? null,
          email: ctx.user?.email ?? null,
          category: input.category,
          message: input.message.trim(),
        });
        return { id, success: true };
      }),
  }),

  // ─── Margin Rules ──────────────────────────────────────────────────────────
  marginRules: router({
    get: publicProcedure.query(async () => {
      const rules = await getMarginRules();
      if (!rules) return null;
      return {
        id: rules.id,
        minMarginPct: parseFloat(rules.minMarginPct as any),
        targetMarginPct: parseFloat(rules.targetMarginPct as any),
        cogPerUnit: parseFloat(rules.cogPerUnit as any),
        platformFeePct: parseFloat(rules.platformFeePct as any),
        shippingCost: parseFloat(rules.shippingCost as any),
        updatedAt: rules.updatedAt,
      };
    }),

    update: publicProcedure
      .input(
        z.object({
          minMarginPct: z.number().min(0).max(100),
          targetMarginPct: z.number().min(0).max(100),
          cogPerUnit: z.number().min(0),
          platformFeePct: z.number().min(0).max(100),
          shippingCost: z.number().min(0),
        })
      )
      .mutation(async ({ input }) => {
        await upsertMarginRules(input);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
