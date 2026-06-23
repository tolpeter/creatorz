// Biztonsági javítás: Row Level Security (RLS) bekapcsolása azokon a public
// táblákon, amelyeket nyers SQL-migrációval hoztunk létre (RLS nélkül), és
// amiket a Supabase advisor flaggelt.
//
// Miért biztonságos: az app MINDEN tábla-hozzáférése a szerver-oldali Drizzle
// kapcsolaton (DATABASE_URL = postgres/service-role) megy, ami MEGKERÜLI az RLS-t.
// Az RLS bekapcsolása (policy nélkül = deny-all) csak az anon/authenticated
// PostgREST API-t zárja el ezekről a tábláktól — az app működése változatlan.
//
// Futtatás:  node --env-file=.env.local scripts/enable-rls.mjs
// (Vagy másold be a lenti ALTER TABLE sorokat a Supabase SQL editorba.)
import postgres from "postgres";

const tables = [
  "ad_invitations",
  "ad_views",
  "push_tokens",
  "tiktok_connections",
  "page_events",
  "referrals",
  "collaboration_events",
];

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  for (const t of tables) {
    await sql.unsafe(`ALTER TABLE IF EXISTS public.${t} ENABLE ROW LEVEL SECURITY`);
    console.log("✓ RLS bekapcsolva:", t);
  }
  console.log("\nKész. A szerver service-role kapcsolaton fut, ezt nem érinti.");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
