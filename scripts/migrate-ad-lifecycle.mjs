// Egyszeri migráció: kampány-életciklus.
//   - ad_status enum: + 'suspended' (felfüggesztve) + 'expired' (lejárt)
//   - ads.deleted_at + ads.deleted_by_role  (soft-delete / archívum)
// Futtatás:  node --env-file=.env.local scripts/migrate-ad-lifecycle.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TYPE ad_status ADD VALUE IF NOT EXISTS 'suspended'`;
  await sql`ALTER TYPE ad_status ADD VALUE IF NOT EXISTS 'expired'`;
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS deleted_at timestamp`;
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS deleted_by_role varchar(10)`;
  await sql`CREATE INDEX IF NOT EXISTS ads_deleted_idx ON ads(deleted_at)`;
  console.log("✓ ad_status (suspended, expired) + ads.deleted_at/deleted_by_role kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
