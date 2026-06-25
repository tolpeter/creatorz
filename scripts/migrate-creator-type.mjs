// Egyszeri migráció: szolgáltatás-típus a tartalomgyártó-profilon.
//   - creator_profiles.creator_type varchar ("ugc" | "influencer" | "model")
// Futtatás:  node --env-file=.env.local scripts/migrate-creator-type.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS creator_type varchar(20) NOT NULL DEFAULT 'ugc'`;
  console.log("✓ creator_profiles.creator_type kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
