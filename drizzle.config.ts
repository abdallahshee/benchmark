import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Same precedence as Next.js: .env.local overrides .env.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "./db/schema/*",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations use the session pooler (port 5432); the transaction pooler is the fallback.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
});
