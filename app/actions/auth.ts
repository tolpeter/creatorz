"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ensureUniqueUsername } from "@/lib/utils/username";
import { dashboardPathForRole } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";
import { sendPasswordResetEmail } from "@/lib/password-reset";
import { recordReferral } from "@/lib/referral";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Email-mező: kis-/nagybetűtől függetlenül fogadjuk el (trim + lowercase),
// így a "Te@Pelda.hu" és a "te@pelda.hu" ugyanaz a fiók.
const emailField = z
  .email("Érvénytelen email cím")
  .transform((s) => s.trim().toLowerCase());

const signUpSchema = z.object({
  role: z.enum(["creator", "brand"]),
  // Csak creator role-nál értelmezett: UGC tartalomgyártó vagy kreatív szakember
  profileKind: z.enum(["ugc", "professional"]).optional().default("ugc"),
  // A profileKind='ugc'-n belüli szolgáltatás-típus.
  creatorType: z.enum(["ugc", "influencer", "model"]).optional().default("ugc"),
  email: emailField,
  password: z.string().min(8, "A jelszó legalább 8 karakter legyen"),
  gdpr: z.boolean().refine((v) => v === true, {
    message: "El kell fogadnod az adatkezelési tájékoztatót",
  }),
});

export type SignUpInput = z.input<typeof signUpSchema>;

function emailLocalPart(email: string): string {
  return email.split("@")[0] ?? "felhasznalo";
}

/**
 * Regisztráció: létrehozza a Supabase auth usert, a `users` sort és a
 * megfelelő (creator/brand) profil placeholder sort.
 */
export async function signUpAction(input: SignUpInput) {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const { role, profileKind, creatorType, email, password } = parsed.data;

  const supabase = await createClient();

  // Admin client: létrehozzuk a Supabase auth usert ELŐRE megerősített állapotban
  // (email_confirm: true). Így a felhasználó rögtön kapja a sessiont, és a saját
  // verifikációs flow-nkat futtatjuk (onboarding végén kapja a megerősítő emailt).
  const admin = createAdminClient();
  const createAuth = () =>
    admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role },
    });

  let { data: created, error: createErr } = await createAuth();

  // Önjavítás "árva" auth-userre: ha a Supabase Auth-ban már létezik az email,
  // DE nincs hozzá app `users` sor (félbemaradt korábbi regisztráció), akkor
  // töröljük az árva auth-usert és újrapróbáljuk. Valódi (app sorral is
  // rendelkező) fiókot SOHA nem törlünk — az a normál "már regisztrált" hibát kapja.
  if (createErr && /regist|already|exist/i.test(createErr.message)) {
    const [appRow] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!appRow) {
      try {
        const res = await db.execute(
          sql`select id from auth.users where lower(email) = ${email} limit 1`,
        );
        const list = Array.isArray(res) ? res : (res as { rows?: unknown[] }).rows ?? [];
        const orphanId = (list[0] as { id?: string } | undefined)?.id;
        if (orphanId) {
          await admin.auth.admin.deleteUser(String(orphanId));
          ({ data: created, error: createErr } = await createAuth());
        }
      } catch {
        /* ha az önjavítás nem megy, marad az eredeti hibaüzenet */
      }
    }
  }

  if (createErr) {
    return { error: authErrorMessage(createErr.message) };
  }
  const authUser = created.user;
  if (!authUser) {
    return { error: "Nem sikerült létrehozni a felhasználót" };
  }

  // Azonnal beléptetjük is — a sessiont a Supabase server client kezeli.
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) {
    return { error: authErrorMessage(signInErr.message) };
  }

  // users sor (idempotens)
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
    return { error: "Nem sikerült létrehozni a felhasználói rekordot" };
  }

  // Placeholder profil sor — az onboarding wizard tölti ki véglegesen
  if (role === "creator") {
    const base = emailLocalPart(email);
    const username = await ensureUniqueUsername(base);
    await db
      .insert(creatorProfiles)
      .values({
        userId: appUserId,
        username,
        displayName: base,
        profileKind,
        // Csak ugc-profilnál van értelme; professionalnál marad az alap.
        creatorType: profileKind === "ugc" ? creatorType : "ugc",
      })
      .onConflictDoNothing({ target: creatorProfiles.userId });
  } else {
    await db
      .insert(brandProfiles)
      .values({
        userId: appUserId,
        companyName: emailLocalPart(email),
      })
      .onConflictDoNothing({ target: brandProfiles.userId });
  }

  // Ajánlás rögzítése, ha a regisztráló meghívó-linkről jött (cz_ref cookie).
  try {
    const cookieStore = await cookies();
    const refCode = cookieStore.get("cz_ref")?.value;
    if (refCode) {
      await recordReferral(refCode, appUserId);
      cookieStore.delete("cz_ref");
    }
  } catch {
    /* best-effort — az ajánlás hiánya ne állítsa meg a regisztrációt */
  }

  const onboardingPath =
    role === "creator" && profileKind === "professional"
      ? "/onboarding/professional"
      : `/onboarding/${role}`;
  await setDevNewsPending();
  return {
    success: true,
    needsConfirmation: false,
    redirectTo: onboardingPath,
  };
}

// ─────────────────── Google (OAuth) regisztráció befejezése ────────────────
const socialSchema = z.object({
  role: z.enum(["creator", "brand"]).default("creator"),
  profileKind: z.enum(["ugc", "professional"]).optional().default("ugc"),
  creatorType: z.enum(["ugc", "influencer", "model"]).optional().default("ugc"),
});

/**
 * A Google-belépés UTÁN futtatja a választott szerepkörrel. A felhasználó már
 * be van jelentkezve a Supabase-be (van session), de még nincs app `users` sora.
 * Itt hozzuk létre a sort + profilt, a nevet/avatart a Google-fiókból átvéve.
 * Az email Google által hitelesített → emailVerified=true (nincs külön megerősítés).
 */
export async function completeSocialSignup(input: z.input<typeof socialSchema>) {
  const parsed = socialSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };
  const { role, profileKind, creatorType } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return { error: "Nincs bejelentkezve" };

  // Ha már van app fiók, ne hozzunk létre újat — irány a vezérlőpult.
  const [existing] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);
  if (existing) {
    return { success: true, redirectTo: dashboardPathForRole(existing.role) };
  }

  const email = user.email.toLowerCase();
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const googleName = String(meta.full_name || meta.name || emailLocalPart(email)).slice(0, 100);
  const googleAvatar = (meta.avatar_url || meta.picture) as string | undefined;

  // users sor — Google által hitelesített email → emailVerified=true
  const inserted = await db
    .insert(users)
    .values({ authId: user.id, email, role, emailVerified: true })
    .onConflictDoNothing({ target: users.authId })
    .returning({ id: users.id });
  let appUserId = inserted[0]?.id;
  if (!appUserId) {
    const [row] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.authId, user.id))
      .limit(1);
    appUserId = row?.id;
  }
  if (!appUserId) return { error: "Nem sikerült létrehozni a felhasználói rekordot" };

  // A szerepkört a Supabase user_metadata-ba is beírjuk (a getCurrentUser ezt nézi).
  try {
    const admin = createAdminClient();
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...meta, role },
    });
  } catch {
    /* best-effort */
  }

  if (role === "creator") {
    const username = await ensureUniqueUsername(emailLocalPart(email));
    await db
      .insert(creatorProfiles)
      .values({
        userId: appUserId,
        username,
        displayName: googleName,
        avatarUrl: googleAvatar || null,
        profileKind,
        creatorType: profileKind === "ugc" ? creatorType : "ugc",
      })
      .onConflictDoNothing({ target: creatorProfiles.userId });
  } else {
    await db
      .insert(brandProfiles)
      .values({
        userId: appUserId,
        companyName: googleName,
        logoUrl: googleAvatar || null,
      })
      .onConflictDoNothing({ target: brandProfiles.userId });
  }

  // Ajánlás rögzítése, ha meghívó-linkről jött (cz_ref cookie).
  try {
    const cookieStore = await cookies();
    const refCode = cookieStore.get("cz_ref")?.value;
    if (refCode) {
      await recordReferral(refCode, appUserId);
      cookieStore.delete("cz_ref");
    }
  } catch {
    /* best-effort */
  }

  const onboardingPath =
    role === "creator" && profileKind === "professional"
      ? "/onboarding/professional"
      : `/onboarding/${role}`;
  return { success: true, redirectTo: onboardingPath };
}

const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Add meg a jelszót"),
  rememberMe: z.boolean().optional(),
});

export async function signInAction(input: z.input<typeof signInSchema>) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }

  const key = await rateLimitKey("signin", parsed.data.email);
  const limit = checkRateLimit(key, 8, 15 * 60 * 1000);
  if (!limit.allowed) {
    return { error: "Túl sok sikertelen próbálkozás. Próbáld újra később." };
  }

  const supabase = await createClient();
  const { email, password, rememberMe } = parsed.data;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Hibás email vagy jelszó" };
  }

  // role + suspended + email_verified lekérése
  let redirectTo = "/dashboard";
  if (data.user) {
    const rows = await db
      .select({
        role: users.role,
        suspended: users.suspended,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.authId, data.user.id))
      .limit(1);

    if (rows[0]?.suspended) {
      await supabase.auth.signOut();
      return { error: "A fiókod fel van függesztve. Vedd fel a kapcsolatot a támogatással." };
    }

    // Nem verifikált emailcím → küldjük a megerősítő oldalra
    if (rows[0] && !rows[0].emailVerified) {
      redirectTo = "/verify-email";
    } else if (rows[0]) {
      redirectTo = dashboardPathForRole(rows[0].role);
    }

    const factors = await supabase.auth.mfa.listFactors();
    const verifiedTotp = factors.data?.totp?.find((factor) => factor.status === "verified");
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (verifiedTotp && aal.data?.currentLevel !== "aal2") {
      await applyRememberMeCookieMode(Boolean(rememberMe));
      await setDevNewsPending();
      return {
        success: true,
        mfaRequired: true,
        factorId: verifiedTotp.id,
        redirectTo,
      };
    }

    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.authId, data.user.id));
  }

  await applyRememberMeCookieMode(Boolean(rememberMe));
  await setDevNewsPending();
  return { success: true, redirectTo };
}

/** Egyszer-használatos jelző: belépés után a vezérlőpulton EGYSZER feljön a
 *  „Fejlesztések" pop-up (a komponens törli). 1 óra alatt érvényes. */
async function setDevNewsPending() {
  try {
    (await cookies()).set("cz_devnews_pending", "1", {
      path: "/",
      maxAge: 3600,
      sameSite: "lax",
    });
  } catch {
    /* best-effort */
  }
}

const mfaVerifySchema = z.object({
  factorId: z.string().min(1),
  code: z.string().trim().regex(/^\d{6}$/, "A kód 6 számjegy legyen"),
  rememberMe: z.boolean().optional(),
});

export async function verifyMfaSignInAction(input: z.input<typeof mfaVerifySchema>) {
  const parsed = mfaVerifySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen kód" };
  }

  const supabase = await createClient();
  const { factorId, code, rememberMe } = parsed.data;
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    return { error: "Hibás vagy lejárt kétlépcsős azonosító kód" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let redirectTo = "/dashboard";
  if (user) {
    const rows = await db
      .select({ role: users.role, suspended: users.suspended })
      .from(users)
      .where(eq(users.authId, user.id))
      .limit(1);

    if (rows[0]?.suspended) {
      await supabase.auth.signOut();
      return { error: "A fiókod fel van függesztve. Vedd fel a kapcsolatot a támogatással." };
    }

    if (rows[0]) redirectTo = dashboardPathForRole(rows[0].role);
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.authId, user.id));
  }

  await applyRememberMeCookieMode(Boolean(rememberMe));
  return { success: true, redirectTo };
}

const magicLinkSchema = z.object({
  email: emailField,
});

export async function sendMagicLinkAction(input: z.input<typeof magicLinkSchema>) {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: `${APP_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { error: authErrorMessage(error.message) };
  }
  return { success: true };
}

export async function sendPasswordResetAction(input: z.input<typeof magicLinkSchema>) {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen email" };
  }

  const key = await rateLimitKey("password-reset", parsed.data.email);
  const limit = checkRateLimit(key, 5, HOUR);
  if (!limit.allowed) {
    return { error: "Túl sok visszaállítási kérés. Próbáld újra később." };
  }

  // Saját, branded Resend-es jelszó-visszaállítás. Biztonsági okból mindig
  // success-szel térünk vissza (nem áruljuk el, létezik-e a fiók).
  await sendPasswordResetEmail(parsed.data.email);
  return { success: true };
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Az új jelszó legalább 8 karakter legyen"),
});

/** Bejelentkezett user jelszó-módosítása (pl. beállítások). */
export async function updatePasswordAction(input: z.input<typeof updatePasswordSchema>) {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen jelszó" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "Nem sikerült frissíteni a jelszót. Nyisd meg újra az emailben kapott linket." };
  }
  return { success: true };
}

const resetWithTokenSchema = z.object({
  token: z.string().min(16, "Érvénytelen token"),
  password: z.string().min(8, "Az új jelszó legalább 8 karakter legyen"),
});

/**
 * Token-alapú jelszó-visszaállítás: a /reset-password/[token] oldalról hívva.
 * A tokent ellenőrzi, lejárat után elutasít, majd a Supabase admin API-val
 * beállítja az új jelszót és törli a tokent.
 */
export async function resetPasswordWithToken(
  input: z.input<typeof resetWithTokenSchema>,
) {
  const parsed = resetWithTokenSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const { token, password } = parsed.data;

  const [row] = await db
    .select({
      id: users.id,
      authId: users.authId,
      expiresAt: users.passwordResetExpiresAt,
    })
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (!row) return { error: "Érvénytelen vagy lejárt link. Kérj újat." };
  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { error: "A jelszó-visszaállító link lejárt — kérj újat." };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(row.authId, {
    password,
  });
  if (error) {
    return { error: "Nem sikerült beállítani az új jelszót. Próbáld újra." };
  }

  await db
    .update(users)
    .set({
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, row.id));

  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // A pop-upok munkamenet-jelzőit töröljük, hogy új belépéskor megint
  // felugorjanak (egyszer / belépés): profilkép-kérő + „Fejlesztések" hír.
  try {
    const store = await cookies();
    store.delete("creatorz_photo_prompt");
    store.delete("cz_devnews_pending");
  } catch {
    /* best-effort */
  }
  return { success: true };
}

async function rateLimitKey(prefix: string, email: string) {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    "unknown";
  return `${prefix}:${ip}:${email.toLowerCase()}`;
}

async function applyRememberMeCookieMode(rememberMe: boolean) {
  if (rememberMe) return;

  const projectRef = getSupabaseProjectRef();
  if (!projectRef) return;

  const authCookiePrefix = `sb-${projectRef}-auth-token`;
  const cookieStore = await cookies();
  cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith(authCookiePrefix))
    .forEach((cookie) => {
      cookieStore.set(cookie.name, cookie.value, {
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    });
}

function getSupabaseProjectRef() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
    return host.split(".")[0] || null;
  } catch {
    return null;
  }
}

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("email rate limit exceeded") ||
    normalized.includes("over_email_send_rate_limit") ||
    normalized.includes("rate limit")
  ) {
    return "Az email-küldési limit átmenetileg betelt. Várj pár percet, vagy állíts be saját SMTP szolgáltatót a Supabase Auth beállításokban.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") || // Supabase admin createUser
    normalized.includes("user already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("email_exists") ||
    normalized.includes("email address has already") ||
    normalized.includes("duplicate")
  ) {
    return "Ezzel az e-mail címmel már létezik fiók. Jelentkezz be, vagy használj másik e-mail címet.";
  }

  if (normalized.includes("password")) {
    return "A jelszó nem felel meg a biztonsági követelményeknek.";
  }

  return "Nem sikerült végrehajtani a műveletet. Próbáld újra később.";
}

// ===========================================================================
// E-mail verifikáció — saját rendszer (Supabase auth-tól független).
// Az onboarding wizard a végén hívja a `triggerVerificationEmail`-t, és
// átirányít a /verify-email-re. A user a kapott linkre kattintva kerül a
// /verify-email/[token]-re, ami a `verifyEmailToken`-t hívja.
// ===========================================================================

/** Küld (vagy újraküld) egy verifikációs emailt a bejelentkezett usernek. */
export async function triggerVerificationEmail() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) return { error: "Nincs bejelentkezve" };

  // Rate limit: max 5 / óra ugyanattól a usertől
  const limit = checkRateLimit(`verify-email:${authUser.id}`, 5, HOUR);
  if (!limit.allowed) {
    return { error: "Túl sok újraküldés. Próbáld pár perc múlva." };
  }

  const [appUser] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.authId, authUser.id))
    .limit(1);

  if (!appUser) return { error: "A felhasználói rekord nem található" };
  if (appUser.emailVerified) return { success: true, alreadyVerified: true };

  // A regisztrált név lekérése: creator → displayName, brand → companyName
  let displayName: string | undefined;
  if (appUser.role === "creator") {
    const [profile] = await db
      .select({ displayName: creatorProfiles.displayName })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, appUser.id))
      .limit(1);
    displayName = profile?.displayName ?? undefined;
  } else if (appUser.role === "brand") {
    const [profile] = await db
      .select({ companyName: brandProfiles.companyName })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, appUser.id))
      .limit(1);
    displayName = profile?.companyName ?? undefined;
  }

  const res = await sendVerificationEmail({
    userId: appUser.id,
    email: appUser.email,
    displayName,
  });
  if (!res.sent) {
    return { error: res.error ?? "Nem sikerült elküldeni az emailt" };
  }
  return { success: true };
}

/**
 * A user a kapott linkről jön — érvényesítjük a tokent és megerősítjük az
 * emailcímet. Lejárt vagy érvénytelen token esetén hiba.
 */
export async function verifyEmailToken(token: string) {
  const trimmed = (token ?? "").trim();
  if (trimmed.length < 16) return { error: "Érvénytelen token" };

  const [row] = await db
    .select({
      id: users.id,
      expiresAt: users.emailVerificationExpiresAt,
      verified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.emailVerificationToken, trimmed))
    .limit(1);

  if (!row) return { error: "Érvénytelen vagy lejárt link" };
  if (row.verified) return { success: true, alreadyVerified: true };

  if (!row.expiresAt || row.expiresAt.getTime() < Date.now()) {
    return { error: "A megerősítő link lejárt — kérj újat." };
  }

  await db
    .update(users)
    .set({
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(users.id, row.id));

  return { success: true };
}
