import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUniqueUsername } from "@/lib/utils/username";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  role: z.enum(["creator", "brand"]),
  profileKind: z.enum(["ugc", "professional"]).optional().default("ugc"),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8),
});

const localPart = (email: string) => email.split("@")[0] || "felhasznalo";

/**
 * Mobil regisztráció: ugyanaz, mint a webes signUpAction, csak a sütis
 * beléptetés nélkül. A mobil app a válasz után supabase.auth.signInWithPassword-szal lép be.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Érvénytelen kérés" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Érvénytelen adatok (email + min. 8 karakter jelszó)" }, { status: 400 });
  }
  const { role, profileKind, email, password } = parsed.data;

  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });
  if (createErr || !created.user) {
    const msg = (createErr?.message ?? "").toLowerCase();
    if (msg.includes("already") || msg.includes("registered")) {
      return Response.json({ error: "Ezzel az emaillel már van fiók." }, { status: 409 });
    }
    return Response.json({ error: "Nem sikerült létrehozni a fiókot." }, { status: 500 });
  }

  const authUser = created.user;
  const inserted = await db
    .insert(users)
    .values({ authId: authUser.id, email, role })
    .onConflictDoNothing({ target: users.authId })
    .returning({ id: users.id });

  let appUserId = inserted[0]?.id;
  if (!appUserId) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, authUser.id))
      .limit(1);
    appUserId = existing[0]?.id;
  }
  if (!appUserId) {
    return Response.json({ error: "Nem sikerült létrehozni a felhasználót." }, { status: 500 });
  }

  if (role === "creator") {
    const username = await ensureUniqueUsername(localPart(email));
    await db
      .insert(creatorProfiles)
      .values({ userId: appUserId, username, displayName: localPart(email), profileKind })
      .onConflictDoNothing({ target: creatorProfiles.userId });
  } else {
    await db
      .insert(brandProfiles)
      .values({ userId: appUserId, companyName: localPart(email) })
      .onConflictDoNothing({ target: brandProfiles.userId });
  }

  return Response.json({ success: true });
}
