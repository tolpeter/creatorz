// Egyszeri migráció: ads.seeking_count ("one" | "multiple" | NULL).
// Hány alkotót keres a kampány; NULL = "nem adom meg" (nem jelenik meg).
// Futtatás:  node --env-file=.env.local scripts/migrate-seeking-count.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE ads ADD COLUMN IF NOT EXISTS seeking_count varchar(16)`;
  console.log("✓ ads.seeking_count oszlop kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
