import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Lang = "en" | "zh";

export const translations = {
  en: {
    // Sidebar / Nav
    appName: "Price Intel",
    appBy: "BY NAVOS",
    nav: {
      dashboard: "Dashboard",
      products: "Products",
      history: "Price History",
      alerts: "Alerts",
      recommendations: "Recommendations",
    },
    guestLabel: "Guest",
    demoMode: "Demo mode",
    signIn: "Sign in",

    // Dashboard
    dashboardTitle: "Price Dashboard",
    dashboardSubtitle: "Unified cross-platform price intelligence — live market view",
    refresh: "Refresh",
    trackedProducts: "Tracked Products",
    acrossAllPlatforms: "across all platforms",
    priceDrops: "Price Drops",
    priceRises: "Price Rises",
    sinceLastPoll: "since last poll",
    avgLandedPrice: "Avg Landed Price",
    allPlatforms: "all platforms",
    searchPlaceholder: "Search products, platforms, categories...",
    myProduct: "MY PRODUCT",
    poll: "Poll",
    current: "CURRENT",
    shipping: "SHIPPING",
    landed: "LANDED",
    lowest: "LOWEST",
    freeShipping: "Free",
    noProducts: "No products tracked yet",
    addFirstProduct: "Add your first product to start monitoring prices",
    addProduct: "Add Product",

    // Products
    productsTitle: "Product Tracking",
    productsSubtitle: "Manage the products and competitors you monitor across platforms",
    newProduct: "New Product",
    removeProduct: "Remove",
    confirmRemove: "Remove this product from tracking?",
    cancel: "Cancel",
    confirm: "Confirm",
    platform: "Platform",
    productName: "Product Name",
    productId: "Product ID / SKU",
    productUrl: "Product URL (optional)",
    category: "Category",
    isOwnProduct: "This is my product",
    isOwnProductDesc: "Mark as your own product to get pricing recommendations",
    adding: "Adding…",
    add: "Add",
    noTrackedProducts: "No products tracked yet",
    addFirstProductHint: "Add products to start monitoring competitor prices",
    productIdPlaceholder: "e.g. B08N5WRWNW",
    categoryPlaceholder: "e.g. Electronics",
    namePlaceholder: "e.g. Wireless Headphones",
    urlPlaceholder: "https://...",
    selectPlatform: "Select platform",
    addProductTitle: "Add Tracked Product",
    addProductDesc: "Enter the product details to start monitoring its price across platforms.",
    removeProductTitle: "Remove Product",
    removeProductDesc: (name: string) => `Remove "${name}" from tracking? This will also delete all price history and alerts for this product.`,
    removing: "Removing…",
    remove: "Remove",
    trackedCount: (n: number) => `${n} product${n !== 1 ? "s" : ""} tracked`,

    // Price History
    historyTitle: "Price History",
    historySubtitle: "Historical price trends and volatility analysis",
    selectProduct: "Select a product",
    landedPrice: "Landed Price",
    listPrice: "List Price",
    overPeriod: "over period",
    noHistory: "No price history available. Select a product to view trends.",
    days: (n: number) => `${n} days`,

    // Alerts
    alertsTitle: "Price Alerts",
    alertsSubtitle: "Configure thresholds and review triggered price change notifications",
    newAlertRule: "New Alert Rule",
    alertLog: "Alert Log",
    rules: "Rules",
    unread: (n: number) => `${n} unread`,
    markAllRead: "Mark all read",
    noAlerts: "No alerts triggered yet",
    noRules: "No alert rules configured",
    createRule: "Create Alert Rule",
    createRuleDesc: "Get notified when a tracked product's price changes beyond your threshold.",
    product: "Product",
    selectProductPlaceholder: "Select a product",
    threshold: "Threshold (%)",
    thresholdHint: "Alert when price changes by at least this percentage",
    direction: "Direction",
    directionAny: "Any direction",
    directionUp: "Price increase only",
    directionDown: "Price decrease only",
    creating: "Creating…",
    createRuleBtn: "Create Rule",
    thresholdLabel: (pct: number) => `Threshold: ${pct}%`,
    directionLabel: (d: string) => `Direction: ${d}`,
    ruleCreated: "Alert rule created",
    ruleDeleted: "Alert rule deleted",
    allMarkedRead: "All alerts marked as read",
    pleaseSelectProduct: "Please select a product",
    thresholdMustBePositive: "Threshold must be a positive number",
    failedPrefix: "Failed: ",

    // Recommendations
    recsTitle: "Pricing Recommendations",
    recsSubtitle: "AI-powered optimal price suggestions based on market data and your margin rules",
    marginRules: "Margin Rules",
    configure: "Configure",
    saving: "Saving…",
    saveRules: "Save Rules",
    cogsPerUnit: "Cost of Goods (per unit)",
    platformFee: "Platform Fee (%)",
    shippingCost: "Shipping Cost (per unit)",
    minMargin: "Minimum Margin",
    targetMargin: "Target Margin",
    cogsLabel: "COGS / Unit",
    platformFeeLabel: "Platform Fee",
    shippingLabel: "Shipping Cost",
    minMarginLabel: "Min Margin",
    targetMarginLabel: "Target Margin",
    suggestedPricesTitle: "Suggested Prices for Your Products",
    noRecs: "No recommendations yet",
    noRecsHint: 'Mark products as "My Product" to get pricing suggestions',
    lowestLanded: "Lowest Landed",
    avgMarket: "Avg Market",
    minPriceFloor: "Min Price Floor",
    targetPrice: "Target Price",
    suggestedPrice: "Suggested Price",
    competitivePositioning: "Competitive positioning: 2% below lowest competitor",
    estMargin: "Est. Margin",
    aboveMin: "Above minimum threshold",
    belowMin: "Below minimum threshold",
    floor: "Floor",
    suggested: "Suggested",
    target: "Target",
    marginUpdated: "Margin rules updated",
    updateFailed: "Failed: ",
    targetMustBeHigher: "Target margin must be higher than minimum margin",

    // Chat
    chatPlaceholder: "Ask anything about your prices...",
    chatVoiceHint: "Voice input (coming soon)",
    chatNewConvo: "New conversation",
    chatSend: "Send",
    chatClear: "Clear",
    chatLiveData: "Live data",
    chatError: "Failed to get response. Please try again.",
    chatSuggestedPrompts: [
      "Which product has the biggest price drop?",
      "Where am I priced above market average?",
      "What's the best price for my product on Amazon?",
      "Which competitor has the lowest landed price?",
    ],

    // Availability
    inStock: "In Stock",
    outOfStock: "Out of Stock",
    limited: "Limited",
    unknown: "Unknown",

    // Platform labels
    platforms: {
      amazon: "Amazon",
      ebay: "eBay",
      shopify: "Shopify",
      etsy: "Etsy",
    },
  },

  zh: {
    // Sidebar / Nav
    appName: "价格情报",
    appBy: "BY NAVOS",
    nav: {
      dashboard: "价格看板",
      products: "商品管理",
      history: "价格走势",
      alerts: "价格预警",
      recommendations: "定价建议",
    },
    guestLabel: "访客",
    demoMode: "演示模式",
    signIn: "登录",

    // Dashboard
    dashboardTitle: "价格看板",
    dashboardSubtitle: "跨平台价格情报 — 实时市场视图",
    refresh: "刷新",
    trackedProducts: "追踪商品",
    acrossAllPlatforms: "覆盖所有平台",
    priceDrops: "价格下降",
    priceRises: "价格上涨",
    sinceLastPoll: "较上次轮询",
    avgLandedPrice: "平均到手价",
    allPlatforms: "全平台",
    searchPlaceholder: "搜索商品、平台、分类…",
    myProduct: "我的商品",
    poll: "轮询",
    current: "当前价",
    shipping: "运费",
    landed: "到手价",
    lowest: "最低",
    freeShipping: "免运费",
    noProducts: "暂无追踪商品",
    addFirstProduct: "添加第一个商品以开始监控价格",
    addProduct: "添加商品",

    // Products
    productsTitle: "商品追踪",
    productsSubtitle: "管理跨平台监控的商品和竞争对手",
    newProduct: "新增商品",
    removeProduct: "移除",
    confirmRemove: "确认移除此商品的追踪？",
    cancel: "取消",
    confirm: "确认",
    platform: "平台",
    productName: "商品名称",
    productId: "商品 ID / SKU",
    productUrl: "商品链接（可选）",
    category: "分类",
    isOwnProduct: "这是我的商品",
    isOwnProductDesc: "标记为自有商品以获取定价建议",
    adding: "添加中…",
    add: "添加",
    noTrackedProducts: "暂无追踪商品",
    addFirstProductHint: "添加商品以开始监控竞争对手价格",
    productIdPlaceholder: "例如 B08N5WRWNW",
    categoryPlaceholder: "例如 电子产品",
    namePlaceholder: "例如 无线耳机",
    urlPlaceholder: "https://...",
    selectPlatform: "选择平台",
    addProductTitle: "添加追踪商品",
    addProductDesc: "输入商品信息，开始跨平台监控价格。",
    removeProductTitle: "移除商品",
    removeProductDesc: (name: string) => `移除"${name}"的追踪？此操作将同时删除该商品的所有价格历史和预警记录。`,
    removing: "移除中…",
    remove: "移除",
    trackedCount: (n: number) => `已追踪 ${n} 个商品`,

    // Price History
    historyTitle: "价格走势",
    historySubtitle: "历史价格走势与波动分析",
    selectProduct: "选择商品",
    landedPrice: "到手价",
    listPrice: "列表价",
    overPeriod: "周期内",
    noHistory: "暂无价格历史，请选择商品查看走势。",
    days: (n: number) => `${n} 天`,

    // Alerts
    alertsTitle: "价格预警",
    alertsSubtitle: "配置预警阈值，查看价格变动通知",
    newAlertRule: "新建预警规则",
    alertLog: "预警日志",
    rules: "规则",
    unread: (n: number) => `${n} 条未读`,
    markAllRead: "全部标记已读",
    noAlerts: "暂无触发的预警",
    noRules: "暂无预警规则",
    createRule: "创建预警规则",
    createRuleDesc: "当追踪商品价格变动超过设定阈值时，自动接收通知。",
    product: "商品",
    selectProductPlaceholder: "选择商品",
    threshold: "阈值 (%)",
    thresholdHint: "价格变动超过此百分比时触发预警",
    direction: "方向",
    directionAny: "任意方向",
    directionUp: "仅价格上涨",
    directionDown: "仅价格下降",
    creating: "创建中…",
    createRuleBtn: "创建规则",
    thresholdLabel: (pct: number) => `阈值：${pct}%`,
    directionLabel: (d: string) => d === "any" ? "任意" : d === "up" ? "上涨" : "下降",
    ruleCreated: "预警规则已创建",
    ruleDeleted: "预警规则已删除",
    allMarkedRead: "已全部标记为已读",
    pleaseSelectProduct: "请选择一个商品",
    thresholdMustBePositive: "阈值必须为正数",
    failedPrefix: "失败：",

    // Recommendations
    recsTitle: "定价建议",
    recsSubtitle: "基于市场数据和利润规则的 AI 最优定价建议",
    marginRules: "利润规则",
    configure: "配置",
    saving: "保存中…",
    saveRules: "保存规则",
    cogsPerUnit: "商品成本（单件）",
    platformFee: "平台佣金 (%)",
    shippingCost: "头程运费（单件）",
    minMargin: "最低利润率",
    targetMargin: "目标利润率",
    cogsLabel: "商品成本",
    platformFeeLabel: "平台佣金",
    shippingLabel: "头程运费",
    minMarginLabel: "最低利润率",
    targetMarginLabel: "目标利润率",
    suggestedPricesTitle: "你的商品定价建议",
    noRecs: "暂无建议",
    noRecsHint: "将商品标记为\"我的商品\"以获取定价建议",
    lowestLanded: "最低到手价",
    avgMarket: "市场均价",
    minPriceFloor: "最低定价底线",
    targetPrice: "目标定价",
    suggestedPrice: "建议定价",
    competitivePositioning: "竞争定位：比最低竞争对手低 2%",
    estMargin: "预估利润率",
    aboveMin: "高于最低阈值",
    belowMin: "低于最低阈值",
    floor: "底线",
    suggested: "建议",
    target: "目标",
    marginUpdated: "利润规则已更新",
    updateFailed: "更新失败：",
    targetMustBeHigher: "目标利润率必须高于最低利润率",

    // Chat
    chatPlaceholder: "询问任何关于价格的问题…",
    chatVoiceHint: "语音输入（即将推出）",
    chatNewConvo: "新对话",
    chatSend: "发送",
    chatClear: "清空",
    chatLiveData: "实时数据",
    chatError: "无法生成回答，请重试。",
    chatSuggestedPrompts: [
      "哪个商品的价格降幅最大？",
      "我的哪些商品定价高于市场均价？",
      "我在亚马逊的商品最佳定价是多少？",
      "哪个竞争对手的到手价最低？",
    ],

    // Availability
    inStock: "有货",
    outOfStock: "缺货",
    limited: "库存紧张",
    unknown: "未知",

    // Platform labels
    platforms: {
      amazon: "亚马逊",
      ebay: "eBay",
      shopify: "Shopify",
      etsy: "Etsy",
    },
  },
} as const;

// Use a structural type that works for both languages
export type Translations = {
  [K in keyof typeof translations.en]: (typeof translations.en)[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : (typeof translations.en)[K] extends readonly string[]
    ? readonly string[]
    : string;
};

type LanguageContextType = {
  lang: Lang;
  t: (typeof translations)[Lang];
  toggleLang: () => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem("price-intel-lang");
      return (saved === "zh" || saved === "en") ? saved : "en";
    } catch {
      return "en";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("price-intel-lang", lang);
    } catch {}
  }, [lang]);

  const toggleLang = () => setLang((l) => (l === "en" ? "zh" : "en"));

  return (
    <LanguageContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return ctx;
}
