// Egyszeri migráció: page_events tábla (first-party látogatottság-mérés).
// Futtatás:  node --env-file=.env.local scripts/migrate-page-events.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS page_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id varchar(64) NOT NULL,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    path varchar(300) NOT NULL,
    duration_ms integer NOT NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS page_events_created_idx ON page_events(created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS page_events_session_idx ON page_events(session_id)`;
  console.log("✓ page_events tábla kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
