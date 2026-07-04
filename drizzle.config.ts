import { defineConfig } from "drizzle-kit"
import { config } from "dotenv"

// Load .env.local for local dev (Vercel injects these automatically in production)
config({ path: ".env.local" })

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
