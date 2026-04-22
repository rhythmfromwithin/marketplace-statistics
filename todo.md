# Price Intelligence Tool — TODO

## Database & Backend
- [x] Define schema: tracked_products, price_snapshots, alert_rules, alert_events, margin_rules tables
- [x] Generate and apply migration SQL
- [x] Seed mock data: 6 products × 4 platforms × 30 days of price history
- [x] tRPC: products.list, products.add, products.remove
- [x] tRPC: prices.dashboard (latest snapshot per product/platform, with delta)
- [x] tRPC: prices.history (time-series for a product)
- [x] tRPC: prices.poll (simulate polling — generate new snapshot with drift)
- [x] tRPC: alerts.rules, alerts.events, alerts.createRule, alerts.deleteRule, alerts.toggleRule, alerts.markRead, alerts.markAllRead, alerts.unreadCount
- [x] tRPC: recommendations.get, recommendations.getAll (compute optimal price from market data + margin rules)
- [x] tRPC: marginRules.get, marginRules.update
- [x] calcDelta helper: direction (up/down/none) + changePct
- [x] computeRecommendation engine: lowestLanded, avgMarket, minPrice, targetPrice, suggestedPrice, estimatedMarginPct

## Frontend
- [x] Global design system: dark theme, Inter font, color palette, CSS variables
- [x] DashboardLayout with sidebar navigation (5 sections + unread alert badge)
- [x] Shared components: PlatformBadge, DeltaBadge, AvailabilityBadge
- [x] Dashboard page: KPI cards, grouped product cards (all platforms per product), LOWEST badge, delta indicators, search filter, Poll button, Refresh
- [x] Products page: add/remove tracked products, platform selector, product ID/URL input, grouped by product name
- [x] Price History page: per-product line chart (Recharts), platform breakdown, time range selector, summary stats
- [x] Alerts page: alert rule CRUD, threshold config, alert log with unread count, mark all read
- [x] Recommendations page: optimal price suggestions, margin rule config dialog
- [x] Platform compatibility layer: normalize current_price, shipping_price, landed_price, availability, seller_id
- [x] Delta indicators: direction arrow + percentage change, color-coded (green=down, red=up)
- [x] Loading skeletons and empty states for all pages
- [x] Toast notifications for price change alerts

## Quality
- [x] TypeScript: 0 errors
- [x] Vitest: 19 tests passing
- [x] Vitest: test price delta calculation logic (5 cases)
- [x] Vitest: test recommendation engine logic (7 cases)
- [x] Vitest: test field naming convention (current_price, shipping_price, landed_price, availability, seller_id, captured_at)
- [x] Vitest: test products.list, alerts.unreadCount, marginRules.get

## AI Chatbox
- [x] Backend: tRPC chat.ask mutation with live price context injected into LLM system prompt
- [x] Frontend: Floating bottom bar (ChatGPT-style pill input with + icon, mic icon, send button)
- [x] Frontend: Expandable chat panel above bar with message history and markdown rendering
- [x] Suggested prompts shown when chat is empty
- [x] Chat available on all pages via DashboardLayout

## Language Toggle (i18n)
- [x] Create LanguageContext with zh/en translations for all UI strings
- [x] Add language toggle button (中/EN) to DashboardLayout header
- [x] Update DashboardLayout navigation labels to use i18n
- [x] Update Dashboard page to use i18n
- [x] Update Products page to use i18n
- [x] Update PriceHistory page to use i18n
- [x] Update Alerts page to use i18n
- [x] Update Recommendations page to use i18n
- [x] Update PriceChat component to use i18n
- [x] Persist language preference to localStorage
