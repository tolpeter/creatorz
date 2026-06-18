// Egyszeri migráció: push_tokens tábla (mobil Expo push értesítések).
// Futtatás:  node --env-file=.env.local scripts/migrate-push-tokens.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS push_tokens (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token text NOT NULL UNIQUE,
    platform varchar(20),
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS push_tokens_user_idx ON push_tokens(user_id)`;
  console.log("✓ push_tokens tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
