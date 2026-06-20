// Egyszeri migráció: hivatalos TikTok Login Kit integráció.
//   - tiktok_connections tábla (OAuth tokenek, külön tárolva)
//   - creator_profiles.tiktok_official flag
// Futtatás:  node --env-file=.env.local scripts/migrate-tiktok-connections.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS tiktok_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    open_id varchar(128) NOT NULL,
    union_id varchar(128),
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    scope text,
    expires_at timestamp,
    refresh_expires_at timestamp,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS tiktok_official boolean NOT NULL DEFAULT false`;
  console.log("✓ tiktok_connections + creator_profiles.tiktok_official kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
