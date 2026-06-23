// Egyszeri migráció: collaboration_events tábla (idővonal-események a chatben).
//   kind: 'delivered' | 'changes_requested' | 'approved'
// Futtatás:  node --env-file=.env.local scripts/migrate-collab-events.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS collaboration_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id uuid NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    kind varchar(24) NOT NULL,
    note text,
    by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS collab_events_collab_idx ON collaboration_events(collaboration_id)`;
  // RLS bekapcsolva (deny-all): csak a szerver service-role éri el, az anon API nem.
  await sql`ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY`;
  console.log("✓ collaboration_events tábla kész (RLS bekapcsolva)");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
