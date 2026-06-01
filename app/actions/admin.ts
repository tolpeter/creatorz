"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { settings, users, creatorProfiles, reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_SETTINGS, type SettingsKey } from "@/lib/settings";
import { recalcAfterHide } from "@/app/actions/_review-helpers";

async function requireAdmin() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return null;
  return current;
}

export async function updateSetting(key: string, value: boolean | number) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  if (!(key in DEFAULT_SETTINGS)) return { error: "Ismeretlen beállítás" };

  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } });

  revalidatePath("/admin/settings");
  revalidatePath("/creator/subscription");
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
