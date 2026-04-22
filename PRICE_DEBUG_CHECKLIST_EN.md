# Price Debug Checklist (Amazon / Rainforest)

Use this checklist to quickly diagnose "price mismatch" issues.  
In most cases, this identifies the root cause in 1-2 minutes.

## 1) Confirm the snapshot is fresh
- Check the product's "last updated" time on the Dashboard.
- If it is not recent, click "Poll" once.
- Refresh the page and verify the latest values.

## 2) Verify price definition (most common confusion)
- `current_price` = item price (without shipping)
- `landed_price` = total price (item price + shipping)
- Before comparing with Amazon, confirm which definition you are using.

## 3) Verify ASIN matches exactly
- In Products, check `platformProductId`.
- It must match the ASIN on the Amazon product page you are comparing against.
- Variant ASINs can have different prices.

## 4) Confirm poll request succeeded
- After clicking "Poll", you should see a success signal.
- If it fails, check backend logs for `prices.poll` errors.

## 5) Confirm real API mode (not Mock)
- `USE_MOCK_API=false`
- `RAINFOREST_API_KEY` is configured and valid
- Otherwise, you may see mock data or fallback behavior.

## 6) Compare with Rainforest raw fields
- Key fields:
  - `buybox_winner.price`
  - `buybox_winner.shipping`
- If raw fields are correct but UI is wrong, the issue is likely mapping/parsing or presentation logic.

## 7) Check for stale data
- If one manual poll immediately fixes the numbers,
- the issue was stale snapshot data, not the current fetch result.

---

## Ultra-quick version (3 steps)
1. Poll once and refresh
2. Confirm `current_price` vs `landed_price`
3. Confirm `platformProductId` (ASIN) matches the Amazon page
