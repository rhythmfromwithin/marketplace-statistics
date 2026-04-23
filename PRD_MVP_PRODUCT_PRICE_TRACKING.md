# Product Requirement Document (PRD) - MVP

## Product Overview

**Product Name (suggested)**  
Price Intel (价格情报工具)

**Positioning**  
A lightweight price intelligence assistant for cross-border sellers and operators.  
Users can paste product links (Amazon first), auto-create tracking, collect snapshots, review history, and get action-ready pricing signals.

**MVP Vision**  
Reduce the time from "I found a competitor" to "I can make a pricing decision" from manual browsing to minutes.

Reference: [Product Site](https://product-price-tracking.onrender.com)

---

## Target Users and Scenarios

### Target Users
- Cross-border e-commerce sellers (Amazon-focused)
- Pricing operators / category operators
- Small teams (founder, PM, operator) validating pricing intelligence workflows

### Core Scenarios
1. Paste a product link and start tracking immediately
2. Review recent 7/14/30-day price trends
3. Identify notable daily price changes
4. Use chat to add tracking via natural language

---

## JTBD (Jobs To Be Done)

- When I discover a competitor product, I want to paste a link and start tracking without manual ASIN/name input.
- When prices move, I want fast visibility so I can react in time.
- When reviewing strategy, I want historical price curves and landed price so I can evaluate outcomes.

---

## MVP Scope

### Included Modules
- Products: tracked product management (add/remove)
- Dashboard: latest snapshots and key pricing fields
- Price History: trend view by product
- Alerts: change rules and event logs
- Chat Assistant: natural language interaction with Amazon URL tracking action
- Bilingual UI: Chinese/English
- Backend integration: Rainforest API for Amazon

### Core Data Models
- `tracked_products`
- `price_snapshots`
- `alert_rules`
- `alert_events`
- `margin_rules`

---

## Functional Requirements

### F1. URL-first Product Tracking (P0)
**Description**: User pastes an Amazon URL; system extracts ASIN, fetches product metadata, and creates tracking.

**Input**
- Amazon product URL (supports common query parameters)

**Output**
- Tracked product created (or deduplicated if already exists)
- Initial price snapshot stored
- Product visible in Products / Dashboard / Price History

**Acceptance Criteria**
- No manual name/ASIN input required
- Duplicate ASIN does not create duplicate record
- Invalid URL returns clear error message

### F2. Snapshot Dashboard (P0)
**Description**: Show latest price state per tracked product.

**Fields**
- `current_price`, `shipping_price`, `landed_price`, `availability`, `seller`, `captured_at`

**Acceptance Criteria**
- Manual refresh/poll works
- Latest snapshot ordering is correct
- Delta direction (`up/down/none`) is accurate

### F3. Price History (P0)
**Description**: View price history by product and time range.

**Acceptance Criteria**
- Supports 7/14/30 day windows
- Current-vs-landed view updates correctly

### F4. Alert Rules (P1)
**Description**: Define threshold and direction, record alert events.

**Acceptance Criteria**
- Rule create/toggle/delete works
- Polling can produce visible events

### F5. Chat Action Execution (P1)
**Description**: Chat requests like "track this product + URL" must execute real actions.

**Acceptance Criteria**
- URL detection triggers backend tracking action
- Response includes execution status and tracked product context
- Frontend refreshes Products / Dashboard / History automatically

---

## Non-Functional Requirements

- Availability: core tracking flow success rate > 95%
- Performance: URL-to-tracking completion within 10s (network/API dependent)
- Reliability: startup migration/table readiness for fresh environments
- Observability: actionable error messages with root cause details
- Security: keys remain server-side and never exposed to client

---

## Success Metrics

### North Star Metric
- Activated Tracked Products per Day

### Supporting Metrics
- URL tracking success rate
- Initial snapshot success rate
- 7-day revisit rate (dashboard/history)
- Avg tracked products per user
- Chat action success rate (not text-only responses)

---

## User Flow (MVP)

1. User sends "track this product + Amazon URL"
2. System extracts ASIN and checks deduplication
3. System fetches live pricing and writes product + snapshot
4. System returns execution result (created / existing / error)
5. UI auto-refreshes Products / Dashboard / Price History

---

## Known Risks and Next Priorities

### Risks
- Third-party API availability and quota
- Native module compatibility in cloud runtimes
- Ephemeral storage persistence risks on free-tier hosting

### Suggested Next Priorities
1. Move from ephemeral SQLite to persistent managed DB
2. Add scheduled polling jobs (queue/cron)
3. Accept URL input without protocol (`amazon.com/...`)
4. Batch import and portfolio-level analysis
5. Add operation audit logs

