/**
 * Phase 3 setup + storage upload teszt.
 * 1) megerősített creator user (admin, nincs email) + placeholder users/creator_profiles sor
 * 2) bejelentkezés anon klienssel → autentikált feltöltés az avatars bucketbe (RLS teszt)
 * 3) publikus URL elérhető? → majd takarítás
 */
import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db/index";
import { users, creatorProfiles } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUniqueUsername } from "../lib/utils/username";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const admin = createClient(URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const email = "phase3-creator@videmark.hu";
const password = "Phase3Test1234";

// 1x1 átlátszó PNG
const pngBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

async function main() {
  // takarítás, ha maradt korábbról
  await db.delete(users).where(eq(users.email, email));
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) await admin.auth.admin.deleteUser(existing.id);

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: "creator" },
  });
  if (error) throw new Error("createUser: " + error.message);
  const authId = data.user!.id;

  const ins = await db
    .insert(users)
    .values({ authId, email, role: "creator" })
    .returning({ id: users.id });
  const appUserId = ins[0]!.id;
  const username = await ensureUniqueUsername("phase3-creator");
  await db.insert(creatorProfiles).values({
    userId: appUserId,
    username,
    displayName: "phase3-creator",
  });

  // 2) bejelentkezés anon klienssel + feltöltés
  const anon = createClient(URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { error: signErr } = await anon.auth.signInWithPassword({ email, password });
  if (signErr) throw new Error("signIn: " + signErr.message);

  const path = `${authId}/test-avatar.png`;
  const bytes = Buffer.from(pngBase64, "base64");
  const { error: upErr } = await anon.storage
    .from("avatars")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error("upload (RLS): " + upErr.message);

  const { data: pub } = anon.storage.from("avatars").getPublicUrl(path);
  const resp = await fetch(pub.publicUrl);
  console.log("✅ Auth feltöltés OK, publikus URL HTTP:", resp.status);

  // takarítás: csak a feltöltött fájl (a usert hagyjuk a UI loginhez)
  await admin.storage.from("avatars").remove([path]);

  console.log("✅ Teszt creator kész:");
  console.log("   email:", email, "| jelszó:", password);
  console.log("   username:", username, "| profileId:", appUserId);
}

main()
  .catch((e) => {
    console.error("❌ HIBA:", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
