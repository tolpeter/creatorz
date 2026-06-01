"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, creatorProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Soft delete: a user `suspended=true` lesz (nem tud belépni), és törlés
 * jelzőként az emailt prefixáljuk. A 30 napos hard-delete-et egy későbbi cron végzi.
 */
export async function deleteOwnAccount(confirmation: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };

  if (confirmation.trim().toLowerCase() !== "törlöm") {
    return { error: 'Írd be pontosan: "törlöm"' };
  }

  const stamp = Date.now();
  await db
    .update(users)
    .set({
      suspended: true,
      email: `deleted-${stamp}-${current.dbUser.email}`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, current.dbUser.id));

  // Creator profil "elrejtése": admin-featured kikapcs, username egyedi keresésre
  if (current.dbUser.role === "creator") {
    await db
      .update(creatorProfiles)
      .set({ isFeatured: false, isAdminFeatured: false, updatedAt: new Date() })
      .where(eq(creatorProfiles.userId, current.dbUser.id));
  }

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
