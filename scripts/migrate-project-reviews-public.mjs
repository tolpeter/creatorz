// Egyszeri migráció: a creator↔creator projekt-értékelések nyilvánossá tétele.
//   - creator_project_reviews.reviewee_id / reviewee_user_id (kit értékeltek)
// Futtatás:  node --env-file=.env.local scripts/migrate-project-reviews-public.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_project_reviews ADD COLUMN IF NOT EXISTS reviewee_id uuid REFERENCES creator_profiles(id) ON DELETE CASCADE`;
  await sql`ALTER TABLE creator_project_reviews ADD COLUMN IF NOT EXISTS reviewee_user_id uuid REFERENCES users(id) ON DELETE CASCADE`;
  await sql`CREATE INDEX IF NOT EXISTS creator_project_reviews_reviewee_idx ON creator_project_reviews(reviewee_id)`;
  console.log("✓ creator_project_reviews reviewee-mezők kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
