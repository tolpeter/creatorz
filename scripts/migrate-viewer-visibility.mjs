// Egyszeri migráció: "látja a megtekintőket" funkció.
//  1) users.can_see_viewers oszlop (admin kapcsolja)
//  2) ad_views tábla (ki nézte meg a hirdetést)
// Futtatás:  node --env-file=.env.local scripts/migrate-viewer-visibility.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS can_see_viewers boolean NOT NULL DEFAULT false`;

  await sql`CREATE TABLE IF NOT EXISTS ad_views (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    viewer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    viewed_date date NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS ad_views_ad_idx ON ad_views(ad_id)`;

  console.log("✓ users.can_see_viewers + ad_views tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
