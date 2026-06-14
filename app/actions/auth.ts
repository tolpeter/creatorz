"use server";

import { z } from "zod";
import { cookies, headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUniqueUsername } from "@/lib/utils/username";
import { dashboardPathForRole } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendVerificationEmail } from "@/lib/email-verification";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const signUpSchema = z.object({
  role: z.enum(["creator", "brand"]),
  // Csak creator role-nál értelmezett: UGC tartalomgyártó vagy kreatív szakember
  profileKind: z.enum(["ugc", "professional"]).optional().default("ugc"),
  email: z.email("Érvénytelen email cím"),
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
  const { role, profileKind, email, password } = parsed.data;

  const supabase = await createClient();

  // Admin client: létrehozzuk a Supabase auth usert ELŐRE megerősített állapotban
  // (email_confirm: true). Így a felhasználó rögtön kapja a sessiont, és a saját
  // verifikációs flow-nkat futtatjuk (onboarding végén kapja a megerősítő emailt).
  const admin = createAdminClient();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role },
  });
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

  const onboardingPath =
    role === "creator" && profileKind === "professional"
      ? "/onboarding/professional"
      : `/onboarding/${role}`;
  return {
    success: true,
    needsConfirmation: false,
    redirectTo: onboardingPath,
  };
}

const signInSchema = z.object({
  email: z.email("Érvénytelen email cím"),
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
  return { success: true, redirectTo };
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
  email: z.email("Érvénytelen email cím"),
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

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${APP_URL}/api/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: "Nem sikerült elküldeni a jelszó-visszaállító emailt" };
  }
  return { success: true };
}

const updatePasswordSchema = z.object({
  password: z.string().min(8, "Az új jelszó legalább 8 karakter legyen"),
});

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

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
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
    normalized.includes("user already registered")
  ) {
    return "Ezzel az email címmel már létezik fiók. Próbálj meg bejelentkezni.";
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
      emailVerified: users.emailVerified,
    })
    .from(users)
    .where(eq(users.authId, authUser.id))
    .limit(1);

  if (!appUser) return { error: "A felhasználói rekord nem található" };
  if (appUser.emailVerified) return { success: true, alreadyVerified: true };

  const res = await sendVerificationEmail({
    userId: appUser.id,
    email: appUser.email,
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
