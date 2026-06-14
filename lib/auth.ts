import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";
import { ensureUniqueUsername } from "@/lib/utils/username";

export type AppUser = typeof users.$inferSelect;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;

function emailLocalPart(email: string | undefined): string {
  return email?.split("@")[0] || "felhasznalo";
}

function metadataRole(user: User): "creator" | "brand" | null {
  const role = user.user_metadata?.role;
  return role === "creator" || role === "brand" ? role : null;
}

async function ensureCreatorProfile(
  user: AppUser,
  email?: string,
): Promise<CreatorProfile> {
  const existing = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);

  if (existing[0]) return existing[0];

  const base = emailLocalPart(email || user.email);
  const username = await ensureUniqueUsername(base);
  await db
    .insert(creatorProfiles)
    .values({
      userId: user.id,
      username,
      displayName: base,
    })
    .onConflictDoNothing({ target: creatorProfiles.userId });

  const created = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);

  if (!created[0]) {
    throw new Error("Nem sikerült létrehozni a creator profilt");
  }
  return created[0];
}

async function ensureBrandProfile(
  user: AppUser,
  email?: string,
): Promise<BrandProfile> {
  const existing = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);

  if (existing[0]) return existing[0];

  await db
    .insert(brandProfiles)
    .values({
      userId: user.id,
      companyName: emailLocalPart(email || user.email),
    })
    .onConflictDoNothing({ target: brandProfiles.userId });

  const created = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);

  if (!created[0]) {
    throw new Error("Nem sikerült létrehozni a márka profilt");
  }
  return created[0];
}

/**
 * Visszaadja a bejelentkezett Supabase auth usert és a hozzá tartozó
 * `users` tábla sort. Ha nincs bejelentkezve, null-t ad vissza.
 */
// React cache(): egy kérésen belül csak EGYSZER fut le (és csak egy auth.getUser()
// hálózati hívás), akárhányszor hívják a layoutok/oldalak/getCurrentBrand stb.
// Ez drasztikusan csökkenti a Supabase auth-végpont terhelését (rate limit ellen).
export const getCurrentUser = cache(async function getCurrentUser(): Promise<{
  authUser: User;
  dbUser: AppUser | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let rows = await db
    .select()
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  if (!rows[0]) {
    const role = metadataRole(user);

    if (role && user.email) {
      await db
        .insert(users)
        .values({ authId: user.id, email: user.email, role })
        .onConflictDoNothing({ target: users.authId });

      rows = await db
        .select()
        .from(users)
        .where(eq(users.authId, user.id))
        .limit(1);
    }
  }

  return { authUser: user, dbUser: rows[0] ?? null };
});

/**
 * A bejelentkezett creator app-user sorát és creator profilját adja vissza.
 * (auth user → users.id → creator_profiles). null, ha nincs / nem creator.
 */
export async function getCurrentCreator(): Promise<{
  appUserId: string;
  profile: CreatorProfile;
} | null> {
  const current = await getCurrentUser();
  if (!current?.dbUser || current.dbUser.role !== "creator") return null;
  const profile = await ensureCreatorProfile(
    current.dbUser,
    current.authUser.email,
  );
  return { appUserId: current.dbUser.id, profile };
}

/** A bejelentkezett brand app-user sorát és brand profilját adja vissza. */
export async function getCurrentBrand(): Promise<{
  appUserId: string;
  profile: BrandProfile;
} | null> {
  const current = await getCurrentUser();
  if (!current?.dbUser || current.dbUser.role !== "brand") return null;
  const profile = await ensureBrandProfile(
    current.dbUser,
    current.authUser.email,
  );
  return { appUserId: current.dbUser.id, profile };
}

/** Role → dashboard útvonal */
export function dashboardPathForRole(role: AppUser["role"]): string {
  switch (role) {
    case "creator":
      return "/creator";
    case "brand":
      return "/brand";
    case "admin":
      return "/admin";
    default:
      return "/";
  }
}
