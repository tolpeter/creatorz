// Egyszeri migráció: alkotó↔alkotó közös munka (márka nélkül).
//   - creator_projects tábla
// Futtatás:  node --env-file=.env.local scripts/migrate-creator-projects.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS creator_projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    partner_id uuid NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
    requester_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    partner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title varchar(160) NOT NULL,
    note text,
    status varchar(20) NOT NULL DEFAULT 'active',
    created_at timestamp NOT NULL DEFAULT now(),
    completed_at timestamp
  )`;
  await sql`CREATE INDEX IF NOT EXISTS creator_projects_requester_idx ON creator_projects(requester_user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS creator_projects_partner_idx ON creator_projects(partner_user_id)`;
  await sql`ALTER TABLE creator_projects ENABLE ROW LEVEL SECURITY`;
  console.log("✓ creator_projects tábla (RLS) kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
