// Egyszeri migráció: brand rating mezők + brand_reviews tábla.
// Futtatás:  node --env-file=.env.local scripts/migrate-brand-reviews.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS average_rating numeric(3,2)`;
  await sql`ALTER TABLE brand_profiles ADD COLUMN IF NOT EXISTS review_count integer NOT NULL DEFAULT 0`;

  await sql`CREATE TABLE IF NOT EXISTS brand_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id uuid NOT NULL UNIQUE REFERENCES collaborations(id) ON DELETE CASCADE,
    brand_id uuid NOT NULL REFERENCES brand_profiles(id) ON DELETE CASCADE,
    creator_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    overall_rating integer NOT NULL,
    communication_rating integer NOT NULL,
    fairness_rating integer NOT NULL,
    clarity_rating integer NOT NULL,
    text text NOT NULL,
    hidden boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS brand_reviews_brand_idx ON brand_reviews(brand_id)`;
  console.log("✓ brand rating mezők + brand_reviews tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
