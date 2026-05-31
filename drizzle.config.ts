import { defineConfig } from "drizzle-kit";

// Next.js olvassa a .env.local-t, de a drizzle-kit nem — töltsük be kézzel.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local hiányában a már beállított env változókkal dolgozunk
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
