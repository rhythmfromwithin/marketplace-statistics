# Product Price Tracking

AI-assisted cross-platform price tracking focused on Amazon (Rainforest API), with:

- URL-to-ASIN auto tracking
- Price snapshots and history
- Dashboard and alerts
- Chat assistant that can add tracking from Amazon links

## Deploy (Render)

This repo includes `render.yaml` for one-click setup.

### 1) Create a Render Web Service from this repo

- Go to Render and create a new **Blueprint** or **Web Service** from your GitHub repo.
- Use branch: `product_price_tracking` (or your default branch where this code lives).

### 2) Build and start commands

- Build: `pnpm install --frozen-lockfile && pnpm build`
- Start: `pnpm start`

### 3) Required environment variables

Set these in Render dashboard:

- `BUILT_IN_FORGE_API_URL` (example: `https://api.deepseek.com`)
- `BUILT_IN_FORGE_API_KEY` (your DeepSeek key)
- `RAINFOREST_API_KEY`
- `OAUTH_SERVER_URL` (set to your Render app URL, e.g. `https://your-app.onrender.com`)
- `OWNER_OPEN_ID` (optional but recommended)

Generated/managed by `render.yaml`:

- `JWT_SECRET` (auto-generated)
- `DATABASE_URL=file:/tmp/dev.db` (ephemeral storage for demo)

## Notes

- The default SQLite path on Render is `/tmp/dev.db`, which is ephemeral.
- For persistent production data, switch to managed DB storage.
- If chat says it cannot respond, verify `BUILT_IN_FORGE_API_KEY` is configured.
