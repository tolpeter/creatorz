import "server-only";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export type AppUser = typeof users.$inferSelect;
export type CreatorProfile = typeof creatorProfiles.$inferSelect;
export type BrandProfile = typeof brandProfiles.$inferSelect;

/**
 * Visszaadja a bejelentkezett Supabase auth usert és a hozzá tartozó
 * `users` tábla sort. Ha nincs bejelentkezve, null-t ad vissza.
 */
export async function getCurrentUser(): Promise<{
  authUser: User;
  dbUser: AppUser | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);

  return { authUser: user, dbUser: rows[0] ?? null };
}

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

  const rows = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, current.dbUser.id))
    .limit(1);

  if (!rows[0]) return null;
  return { appUserId: current.dbUser.id, profile: rows[0] };
}

/** A bejelentkezett brand app-user sorát és brand profilját adja vissza. */
export async function getCurrentBrand(): Promise<{
  appUserId: string;
  profile: BrandProfile;
} | null> {
  const current = await getCurrentUser();
  if (!current?.dbUser || current.dbUser.role !== "brand") return null;

  const rows = await db
    .select()
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, current.dbUser.id))
    .limit(1);

  if (!rows[0]) return null;
  return { appUserId: current.dbUser.id, profile: rows[0] };
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
