"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { savedCreators, creatorProfiles, notifications } from "@/lib/db/schema";
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
    const inserted = await db
      .insert(savedCreators)
      .values({ brandId: brand.profile.id, creatorId: id.data })
      .onConflictDoNothing()
      .returning({ creatorId: savedCreators.creatorId });
    saved = true;

    // Értesítés a tartalomgyártónak — a márka NEVE nélkül (csak hogy elmentették).
    // Csak akkor, ha tényleg új mentés történt (nem duplikátum).
    if (inserted[0]) {
      try {
        const [c] = await db
          .select({ userId: creatorProfiles.userId })
          .from(creatorProfiles)
          .where(eq(creatorProfiles.id, id.data))
          .limit(1);
        if (c) {
          await db.insert(notifications).values({
            userId: c.userId,
            type: "saved",
            title: "Felvettek a kedvencek közé ⭐",
            body: "Egy márka elmentette a profilodat a kedvencei közé.",
            link: "/creator",
          });
        }
      } catch {
        // best-effort: az értesítés hibája ne akadályozza a mentést
      }
    }
  }

  revalidatePath("/brand/saved");
  return { success: true, saved };
}
