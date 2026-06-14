"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { savedCreators } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand } from "@/lib/auth";

/** A bejelentkezett márka által mentett creator-id-k (opcionálisan egy halmazból). */
export async function getSavedCreatorIds(within?: string[]): Promise<string[]> {
  const brand = await getCurrentBrand();
  if (!brand) return [];
  const rows = await db
    .select({ creatorId: savedCreators.creatorId })
    .from(savedCreators)
    .where(
      within && within.length
        ? and(eq(savedCreators.brandId, brand.profile.id), inArray(savedCreators.creatorId, within))
        : eq(savedCreators.brandId, brand.profile.id),
    );
  return rows.map((r) => r.creatorId);
}

export async function toggleSavedCreator(creatorId: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka menthet creatort" };

  const id = z.string().uuid().safeParse(creatorId);
  if (!id.success) return { error: "Érvénytelen creator" };

  const existing = await db
    .select({ creatorId: savedCreators.creatorId })
    .from(savedCreators)
    .where(
      and(
        eq(savedCreators.brandId, brand.profile.id),
        eq(savedCreators.creatorId, id.data)
      )
    )
    .limit(1);

  let saved: boolean;
  if (existing.length > 0) {
    await db
      .delete(savedCreators)
      .where(
        and(
          eq(savedCreators.brandId, brand.profile.id),
          eq(savedCreators.creatorId, id.data)
        )
      );
    saved = false;
  } else {
    await db
      .insert(savedCreators)
      .values({ brandId: brand.profile.id, creatorId: id.data })
      .onConflictDoNothing();
    saved = true;
  }

  revalidatePath("/brand/saved");
  return { success: true, saved };
}
