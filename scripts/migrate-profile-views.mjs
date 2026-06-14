// Egyszeri migráció: profile_views tábla.
// Futtatás:  node --env-file=.env.local scripts/migrate-profile-views.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS profile_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    viewed_date date NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS profile_views_unique_day_idx ON profile_views(creator_id, brand_id, viewed_date)`;
  await sql`CREATE INDEX IF NOT EXISTS profile_views_creator_idx ON profile_views(creator_id)`;
  console.log("✓ profile_views tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
