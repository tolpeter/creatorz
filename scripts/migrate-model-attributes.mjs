// Egyszeri migráció: modell-specifikus ügynökségi adatlap.
//   - creator_profiles.model_attributes jsonb
// Futtatás:  node --env-file=.env.local scripts/migrate-model-attributes.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS model_attributes jsonb`;
  console.log("✓ creator_profiles.model_attributes kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
