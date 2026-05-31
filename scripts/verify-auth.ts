/**
 * Phase 2 auth verifikáció email-küldés nélkül.
 * Az admin API-val (service role) hozunk létre megerősített usereket (nincs email),
 * majd a Server Action-nel AZONOS DB-insert logikát futtatjuk (importált modulok).
 */
import { createClient } from "@supabase/supabase-js";
import { db } from "../lib/db/index";
import { users, creatorProfiles, brandProfiles } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUniqueUsername } from "../lib/utils/username";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function localPart(email: string) {
  return email.split("@")[0]!;
}

async function makeUser(email: string, role: "creator" | "brand") {
  // 1) Megerősített auth user (nem küld emailt)
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: "VerifyTest1234",
    email_confirm: true,
    user_metadata: { role },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  const authId = data.user!.id;

  // 2) users sor (az action logikája)
  const inserted = await db
    .insert(users)
    .values({ authId, email, role })
    .onConflictDoNothing({ target: users.authId })
    .returning({ id: users.id });
  const appUserId = inserted[0]!.id;

  // 3) profil sor (az action logikája)
  if (role === "creator") {
    const username = await ensureUniqueUsername(localPart(email));
    await db
      .insert(creatorProfiles)
      .values({ userId: appUserId, username, displayName: localPart(email) })
      .onConflictDoNothing({ target: creatorProfiles.userId });
  } else {
    await db
      .insert(brandProfiles)
      .values({ userId: appUserId, companyName: localPart(email) })
      .onConflictDoNothing({ target: brandProfiles.userId });
  }
  return { authId, appUserId };
}

const creatorEmail = "verify-creator@videmark.hu";
const brandEmail = "verify-brand@videmark.hu";

async function main() {
  const c = await makeUser(creatorEmail, "creator");
  const b = await makeUser(brandEmail, "brand");

  const cu = await db.select().from(users).where(eq(users.id, c.appUserId));
  const cp = await db
    .select({ username: creatorProfiles.username, displayName: creatorProfiles.displayName })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, c.appUserId));
  const bu = await db.select().from(users).where(eq(users.id, b.appUserId));
  const bp = await db
    .select({ companyName: brandProfiles.companyName })
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, b.appUserId));

  console.log("✅ CREATOR users:", cu[0]?.role, "| creator_profiles:", cp[0]);
  console.log("✅ BRAND   users:", bu[0]?.role, "| brand_profiles:", bp[0]);
  console.log("Kész — login UI teszthez ezek a megerősített userek készen állnak.");
}

main()
  .catch((e) => {
    console.error("❌ HIBA:", (e as Error).message);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
