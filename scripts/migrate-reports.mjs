// Egyszeri migráció: reports tábla.
// Futtatás:  node --env-file=.env.local scripts/migrate-reports.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('open','resolved','dismissed');
  EXCEPTION WHEN duplicate_object THEN null; END $$;`;

  await sql`CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    target_type varchar(20) NOT NULL,
    target_id uuid NOT NULL,
    target_label text,
    target_url text,
    reason varchar(40) NOT NULL,
    note text,
    status report_status NOT NULL DEFAULT 'open',
    created_at timestamp NOT NULL DEFAULT now(),
    resolved_at timestamp
  )`;
  await sql`CREATE INDEX IF NOT EXISTS reports_status_idx ON reports(status)`;
  console.log("✓ reports tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
