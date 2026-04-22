import dotenv from "dotenv";

// Load .env.local first for local development overrides, then .env fallback.
dotenv.config({ path: ".env.local" });
dotenv.config();
