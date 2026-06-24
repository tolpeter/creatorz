// Egyszeri migráció: felhasználói email-értesítési beállítások.
//   - users.email_prefs jsonb (null = mindenről kap emailt)
// Futtatás:  node --env-file=.env.local scripts/migrate-email-prefs.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email_prefs jsonb`;
  console.log("✓ users.email_prefs kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
