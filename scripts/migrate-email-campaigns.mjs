// Egyszeri migráció: email-kampány követés (megnyitás / kattintás / konverzió).
//   - email_campaign_recipients tábla
// Futtatás:  node --env-file=.env.local scripts/migrate-email-campaigns.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`CREATE TABLE IF NOT EXISTS email_campaign_recipients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign varchar(64) NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email text NOT NULL,
    token varchar(64) NOT NULL UNIQUE,
    sent_at timestamp,
    opened_at timestamp,
    clicked_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
  )`;
  await sql`CREATE INDEX IF NOT EXISTS email_campaign_recipients_campaign_idx ON email_campaign_recipients(campaign)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_recipients_token_idx ON email_campaign_recipients(token)`;
  await sql`CREATE INDEX IF NOT EXISTS email_campaign_recipients_user_idx ON email_campaign_recipients(user_id)`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS email_campaign_recipients_campaign_user_idx ON email_campaign_recipients(campaign, user_id)`;
  await sql`ALTER TABLE email_campaign_recipients ENABLE ROW LEVEL SECURITY`;
  console.log("✓ email_campaign_recipients tábla (RLS) kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
