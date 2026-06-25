// Egyszeri migráció: a hivatalos TikTok video.list scope-ból lekért publikus
// videók tárolása a creator-profilon.
//   - creator_profiles.tiktok_videos jsonb
// Futtatás:  node --env-file=.env.local scripts/migrate-tiktok-videos.mjs
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE creator_profiles ADD COLUMN IF NOT EXISTS tiktok_videos jsonb`;
  console.log("✓ creator_profiles.tiktok_videos kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}
