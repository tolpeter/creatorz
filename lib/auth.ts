import "server-only";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@supabase/supabase-js";

export type AppUser = typeof users.$inferSelect;

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
