/**
 * Production env validation. Csak akkor kiabál, ha PROD-ban hiányzik egy kulcs.
 * (Dev közben opcionálisak — pl. nem kell mindenkinek Replicate token.)
 */
const REQUIRED_PROD = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_CREATOR_MONTHLY",
  "STRIPE_PRICE_FEATURE_7DAY",
  "STRIPE_PRICE_FEATURE_30DAY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
] as const;

if (process.env.NODE_ENV === "production") {
  const missing = REQUIRED_PROD.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(
      `[env] ⚠️ Hiányzó production környezeti változók: ${missing.join(", ")}`
    );
  }
}

export const env = {
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  isProd: process.env.NODE_ENV === "production",
};
