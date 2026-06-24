// Egyszeri migráció: profi együttműködés-workspace.
//   - collaborations: agreed_deadline, agreement_note, agreed_at, current_round
//   - collaboration_deliverables tábla (leadott linkek, revíziós körök)
// Futtatás:  node --env-file=.env.local scripts/migrate-collab-pro.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS agreed_deadline timestamp`;
  await sql`ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS agreement_note text`;
  await sql`ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS agreed_at timestamp`;
  await sql`ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS current_round integer NOT NULL DEFAULT 1`;

  await sql`CREATE TABLE IF NOT EXISTS collaboration_deliverables (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_id uuid NOT NULL REFERENCES collaborations(id) ON DELETE CASCADE,
    url text NOT NULL,
    title varchar(200),
    note text,
    round integer NOT NULL DEFAULT 1,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS collab_deliverables_collab_idx ON collaboration_deliverables(collaboration_id)`;
  await sql`ALTER TABLE collaboration_deliverables ENABLE ROW LEVEL SECURITY`;

  console.log("✓ collaborations agreement-mezők + collaboration_deliverables (RLS) kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
