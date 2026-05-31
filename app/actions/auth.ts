"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureUniqueUsername } from "@/lib/utils/username";
import { dashboardPathForRole } from "@/lib/auth";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const signUpSchema = z.object({
  role: z.enum(["creator", "brand"]),
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
  const { role, email, password } = parsed.data;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${APP_URL}/api/auth/callback`,
      data: { role },
    },
  });

  if (error) {
    return { error: error.message };
  }

  const authUser = data.user;
  if (!authUser) {
    return { error: "Nem sikerült létrehozni a felhasználót" };
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

  const needsConfirmation = !data.session;
  return {
    success: true,
    needsConfirmation,
    redirectTo: `/onboarding/${role}`,
  };
}

const signInSchema = z.object({
  email: z.email("Érvénytelen email cím"),
  password: z.string().min(1, "Add meg a jelszót"),
});

export async function signInAction(input: z.input<typeof signInSchema>) {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Hibás email vagy jelszó" };
  }

  // role lekérése a users táblából a redirecthez
  let redirectTo = "/dashboard";
  if (data.user) {
    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.authId, data.user.id))
      .limit(1);
    if (rows[0]) {
      redirectTo = dashboardPathForRole(rows[0].role);
    }
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.authId, data.user.id));
  }

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
    return { error: error.message };
  }
  return { success: true };
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { success: true };
}
