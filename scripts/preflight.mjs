/**
 * Pre-deploy ellenőrzés. Lefuttatja a kulcs-ellenőrzéseket lokálisan, mielőtt
 * a Vercel-re push-olnál.
 *   node --env-file=.env.local scripts/preflight.mjs
 */
const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
  "CRON_SECRET",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_PRICE_CREATOR_MONTHLY",
  "STRIPE_PRICE_FEATURE_7DAY",
  "STRIPE_PRICE_FEATURE_30DAY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "ADMIN_EMAIL",
];

const OPTIONAL = [
  "STRIPE_WEBHOOK_SECRET",
  "REPLICATE_API_TOKEN",
  "YOUTUBE_API_KEY",
  "META_GRAPH_API_TOKEN",
];

let ok = true;
console.log("=== Pre-deploy ellenőrzés ===\n");
console.log("Kötelező env változók:");
for (const k of REQUIRED) {
  const v = process.env[k];
  if (v && v.length > 0) {
    console.log(`  ✅ ${k}`);
  } else {
    console.log(`  ❌ ${k} HIÁNYZIK`);
    ok = false;
  }
}
console.log("\nOpcionális env változók:");
for (const k of OPTIONAL) {
  console.log(`  ${process.env[k] ? "✅" : "·"} ${k}`);
}

// DB kapcsolat
import("postgres").then(async (m) => {
  const sql = m.default(process.env.DATABASE_URL, { prepare: false });
  try {
    const r = await sql`select count(*)::int as n from public.users`;
    console.log(`\n✅ DB kapcsolat OK (${r[0].n} user)`);
  } catch (e) {
    console.log(`\n❌ DB kapcsolat HIBA: ${e.message}`);
    ok = false;
  }
  await sql.end();

  // Stripe price ellenőrzés
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    for (const k of ["STRIPE_PRICE_CREATOR_MONTHLY", "STRIPE_PRICE_FEATURE_7DAY", "STRIPE_PRICE_FEATURE_30DAY"]) {
      const id = process.env[k];
      if (!id) continue;
      const p = await stripe.prices.retrieve(id);
      console.log(`✅ ${k}: ${p.unit_amount / 100} ${p.currency.toUpperCase()} (${p.recurring ? "recurring" : "one-time"}) active=${p.active}`);
    }
  } catch (e) {
    console.log(`❌ Stripe ellenőrzés HIBA: ${e.message}`);
    ok = false;
  }

  console.log("\n" + (ok ? "✅ Készen állsz a deploy-ra!" : "❌ Javítsd a fenti hibákat először."));
  process.exit(ok ? 0 : 1);
});
