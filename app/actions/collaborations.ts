"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  collaborations,
  ads,
  creatorProfiles,
  brandProfiles,
  brandReviews,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser, getCurrentBrand, getCurrentCreator } from "@/lib/auth";

export type CollabItem = {
  id: string;
  status: string;
  acceptedAt: Date;
  deliveredAt: Date | null;
  completedAt: Date | null;
  adId: string;
  adTitle: string;
  partnerName: string;
  partnerAvatar: string | null;
  viewerRole: "brand" | "creator";
  brandReviewed: boolean;
};

/** A bejelentkezett felhasználó együttműködései (szerepkör-érzékeny partnerrel). */
export async function getMyCollaborations(): Promise<CollabItem[]> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return [];

  if (current.dbUser.role === "brand") {
    const brand = await getCurrentBrand();
    if (!brand) return [];
    const rows = await db
      .select({
        id: collaborations.id,
        status: collaborations.status,
        acceptedAt: collaborations.acceptedAt,
        deliveredAt: collaborations.deliveredAt,
        completedAt: collaborations.completedAt,
        adId: collaborations.adId,
        adTitle: ads.title,
        partnerName: creatorProfiles.displayName,
        partnerAvatar: creatorProfiles.avatarUrl,
      })
      .from(collaborations)
      .innerJoin(ads, eq(ads.id, collaborations.adId))
      .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
      .where(eq(collaborations.brandId, brand.profile.id))
      .orderBy(desc(collaborations.acceptedAt));
    return rows.map((r) => ({ ...r, viewerRole: "brand" as const, brandReviewed: false }));
  }

  if (current.dbUser.role === "creator") {
    const creator = await getCurrentCreator();
    if (!creator) return [];
    const rows = await db
      .select({
        id: collaborations.id,
        status: collaborations.status,
        acceptedAt: collaborations.acceptedAt,
        deliveredAt: collaborations.deliveredAt,
        completedAt: collaborations.completedAt,
        adId: collaborations.adId,
        adTitle: ads.title,
        partnerName: brandProfiles.companyName,
        partnerAvatar: brandProfiles.logoUrl,
        reviewId: brandReviews.id,
      })
      .from(collaborations)
      .innerJoin(ads, eq(ads.id, collaborations.adId))
      .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
      .leftJoin(brandReviews, eq(brandReviews.collaborationId, collaborations.id))
      .where(eq(collaborations.creatorId, creator.profile.id))
      .orderBy(desc(collaborations.acceptedAt));
    return rows.map(({ reviewId, ...r }) => ({
      ...r,
      viewerRole: "creator" as const,
      brandReviewed: reviewId != null,
    }));
  }

  return [];
}

/** Creator: leadja a munkát. */
export async function markDelivered(collabId: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak tartalomgyártó jelölheti leadottnak." };

  const [c] = await db
    .select({
      adTitle: ads.title,
      brandUserId: brandProfiles.userId,
      creatorName: creatorProfiles.displayName,
    })
    .from(collaborations)
    .innerJoin(ads, eq(ads.id, collaborations.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(and(eq(collaborations.id, collabId), eq(collaborations.creatorId, creator.profile.id)))
    .limit(1);
  if (!c) return { error: "Az együttműködés nem található." };

  await db
    .update(collaborations)
    .set({ deliveredAt: new Date() })
    .where(eq(collaborations.id, collabId));

  await db.insert(notifications).values({
    userId: c.brandUserId,
    type: "collab_delivered",
    title: "A tartalomgyártó leadta a munkát 📦",
    body: `${c.creatorName} leadta: „${c.adTitle}". Ellenőrizd és zárd le az együttműködést.`,
    link: "/brand/collaborations",
  });

  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}

/** Brand: lezárja az együttműködést. */
export async function markCompleted(collabId: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak márka zárhatja le az együttműködést." };

  const [c] = await db
    .select({
      adTitle: ads.title,
      creatorUserId: creatorProfiles.userId,
      brandName: brandProfiles.companyName,
    })
    .from(collaborations)
    .innerJoin(ads, eq(ads.id, collaborations.adId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .where(and(eq(collaborations.id, collabId), eq(collaborations.brandId, brand.profile.id)))
    .limit(1);
  if (!c) return { error: "Az együttműködés nem található." };

  await db
    .update(collaborations)
    .set({ completedAt: new Date(), status: "closed" })
    .where(eq(collaborations.id, collabId));

  await db.insert(notifications).values({
    userId: c.creatorUserId,
    type: "collab_completed",
    title: "Lezárult az együttműködés ✅",
    body: `${c.brandName} lezárta: „${c.adTitle}". Köszönjük a közös munkát!`,
    link: "/creator/collaborations",
  });

  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}
