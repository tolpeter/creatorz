"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { settings, users, creatorProfiles, reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SETTINGS, type SettingsKey } from "@/lib/settings";
import { recalcAfterHide } from "@/app/actions/_review-helpers";

async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

/**
 * Felhasználó VÉGLEGES törlése: a Supabase auth user + a public DB sor
 * (cascade törli a profilt, hirdetéseket, üzeneteket stb.). Admin nem
 * törölhető, és magadat sem törölheted.
 */
export async function deleteUser(userId: string) {
  const current = await requireAdmin();
  if (!current) return { error: "Csak admin" };

  const [target] = await db
    .select({ id: users.id, authId: users.authId, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { error: "A felhasználó nem található" };
  if (target.id === current.dbUser?.id) {
    return { error: "Magadat nem törölheted." };
  }
  if (target.role === "admin") {
    return { error: "Admin fiók nem törölhető." };
  }

  // 1) Supabase auth user törlése (best-effort — ha már nincs, megyünk tovább).
  if (target.authId) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(target.authId);
    } catch {
      // ignoráljuk — a DB-sor törlése a lényeg
    }
  }
  // 2) public DB sor — a FK-k ON DELETE CASCADE-del takarítanak.
  await db.delete(users).where(eq(users.id, userId));

  revalidatePath("/admin/users");
  revalidatePath("/admin/creators");
  revalidatePath("/admin/brands");
  revalidatePath("/admin");
  return { success: true };
}

export async function updateSetting(
  key: string,
  value: boolean | number | string,
) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  if (!(key in DEFAULT_SETTINGS)) return { error: "Ismeretlen beállítás" };

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });

  revalidatePath("/admin/settings");
  revalidatePath("/creator/subscription");
  // Jogi adatok módosulása ezt is friss kell, hogy mutassa:
  if (key.startsWith("legal_")) {
    revalidatePath("/adatvedelem");
    revalidatePath("/aszf");
    revalidatePath("/cookies");
  }
  return { success: true };
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.update(users).set({ suspended, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { success: true };
}

const roleSchema = z.enum(["creator", "brand", "admin"]);
export async function setUserRole(userId: string, role: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) return { error: "Érvénytelen szerepkör" };
  await db.update(users).set({ role: parsed.data, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { success: true };
}

export async function setUserApproved(userId: string, approved: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.update(users).set({ approved, updatedAt: new Date() }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function setAdminFeatured(creatorId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(creatorProfiles)
    .set({ isAdminFeatured: value, updatedAt: new Date() })
    .where(eq(creatorProfiles.id, creatorId));
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function setCreatorVerified(creatorId: string, value: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(creatorProfiles)
    .set({
      verified: value,
      verifiedAt: value ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creatorId));
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function setReviewHidden(reviewId: string, hidden: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  const rows = await db
    .update(reviews)
    .set({ hidden, reported: hidden ? false : undefined })
    .where(eq(reviews.id, reviewId))
    .returning({ creatorId: reviews.creatorId });
  if (rows[0]) await recalcAfterHide(rows[0].creatorId);
  revalidatePath("/admin/reports");
  return { success: true };
}
