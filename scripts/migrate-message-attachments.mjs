// Egyszeri migráció: üzenet-csatolmány oszlopok + "messages" storage bucket.
// Futtatás:  node --env-file=.env.local scripts/migrate-message-attachments.mjs
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
try {
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_url text`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_name text`;
  console.log("✓ messages.attachment_url / attachment_name kész");
} catch (e) {
  console.error("DB hiba:", e.message);
} finally {
  await sql.end();
}

try {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.storage.createBucket("messages", {
    public: true,
    fileSizeLimit: "25MB",
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("Bucket hiba:", error.message);
  } else {
    console.log("✓ 'messages' bucket kész");
  }
} catch (e) {
  console.error("Bucket kivétel:", e.message);
}
