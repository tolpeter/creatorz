// Egyszeri migráció: ad_invitations tábla (márka → creator meghívás hirdetésre).
// Futtatás:  node --env-file=.env.local scripts/migrate-ad-invitations.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS ad_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_id uuid NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    message text,
    status varchar(20) NOT NULL DEFAULT 'pending',
    created_at timestamp NOT NULL DEFAULT now(),
    responded_at timestamp
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ad_invitations_unique_idx ON ad_invitations(ad_id, creator_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ad_invitations_creator_idx ON ad_invitations(creator_id)`;
  await sql`CREATE INDEX IF NOT EXISTS ad_invitations_brand_idx ON ad_invitations(brand_id)`;
  console.log("✓ ad_invitations tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
