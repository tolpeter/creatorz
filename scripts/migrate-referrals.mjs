// Egyszeri migráció: ajánlási (referral) program.
//   - users.referral_code (egyedi)
//   - referrals tábla
// Futtatás:  node --env-file=.env.local scripts/migrate-referrals.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code varchar(16)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_idx ON users(referral_code)`;
  await sql`CREATE TABLE IF NOT EXISTS referrals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON referrals(referrer_user_id)`;
  console.log("✓ referral_code + referrals tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
