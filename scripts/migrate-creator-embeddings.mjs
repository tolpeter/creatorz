// Egyszeri migráció: creator_profiles.embedding (AI matching vektor).
// Futtatás:  node --env-file=.env.local scripts/migrate-creator-embeddings.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS embedding jsonb`;
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS embedding_updated_at timestamp`;
  console.log("✓ creator_profiles.embedding oszlopok kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
