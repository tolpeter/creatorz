// Egyszeri migráció: a közös projekt = a márkás együttműködéssel azonos folyamat.
//   - creator_projects: agreement_note/agreed_deadline/agreed_at, delivered_at,
//     approved_at, current_round
//   - creator_project_deliverables (linkek)
//   - creator_project_reviews (kölcsönös, kötelező értékelés a lezáráshoz)
// Futtatás:  node --env-file=.env.local scripts/migrate-creator-projects-pro.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS agreement_note text`;
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS agreed_deadline timestamp`;
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS agreed_at timestamp`;
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS delivered_at timestamp`;
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS approved_at timestamp`;
  await sql`ALTER TABLE creator_projects ADD COLUMN IF NOT EXISTS current_round integer NOT NULL DEFAULT 1`;

  await sql`CREATE TABLE IF NOT EXISTS creator_project_deliverables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES creator_projects(id) ON DELETE CASCADE,
    url text NOT NULL,
    title varchar(200),
    note text,
    round integer NOT NULL DEFAULT 1,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS creator_project_deliverables_project_idx ON creator_project_deliverables(project_id)`;
  await sql`ALTER TABLE creator_project_deliverables ENABLE ROW LEVEL SECURITY`;

  await sql`CREATE TABLE IF NOT EXISTS creator_project_reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES creator_projects(id) ON DELETE CASCADE,
    reviewer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_rating integer NOT NULL,
    text text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS creator_project_reviews_unique_idx ON creator_project_reviews(project_id, reviewer_user_id)`;
  await sql`ALTER TABLE creator_project_reviews ENABLE ROW LEVEL SECURITY`;

  console.log("✓ creator_projects pro-mezők + deliverables + reviews kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
