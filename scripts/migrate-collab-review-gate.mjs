// Egyszeri migráció: kötelező kölcsönös értékelés a lezáráshoz.
//   - collaborations.approved_at: a márka jóváhagyásának időpontja (review fázis)
// A lezárás (completed_at + status='closed') mostantól CSAK akkor történik meg,
// ha MINDKÉT fél értékelt — ez kódból van vezérelve, séma-szinten csak az
// approved_at oszlop kell.
// Futtatás:  node --env-file=.env.local scripts/migrate-collab-review-gate.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS approved_at timestamp`;
  console.log("✓ collaborations.approved_at kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
