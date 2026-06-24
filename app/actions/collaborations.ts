"use server";

import { and, asc, desc, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  collaborations,
  collaborationEvents,
  ads,
  creatorProfiles,
  brandProfiles,
  brandReviews,
  reviews,
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

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "delivered",
      byUserId: creator.appUserId,
    });
  } catch {
    /* a collaboration_events migráció még nem futott le — ne álljon le */
  }

  await db.insert(notifications).values({
    userId: c.brandUserId,
    type: "collab_delivered",
    title: "A tartalomgyártó leadta a munkát 📦",
    body: `${c.creatorName} leadta: „${c.adTitle}". Nézd át, és hagyd jóvá vagy kérj változtatást.`,
    link: `/brand/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}

/** Brand: változtatást kér a leadott munkára (a creator újra leadhat). */
export async function requestChanges(collabId: string, note: string) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak márka kérhet változtatást." };

  const [c] = await db
    .select({
      adTitle: ads.title,
      completedAt: collaborations.completedAt,
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
  if (c.completedAt) return { error: "Lezárt együttműködésnél már nem kérhetsz változtatást." };

  // A leadást visszavonjuk, hogy a creator újra leadhassa a javított anyagot.
  await db
    .update(collaborations)
    .set({ deliveredAt: null, status: "active" })
    .where(eq(collaborations.id, collabId));

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "changes_requested",
      note: note?.trim() ? note.trim().slice(0, 1000) : null,
      byUserId: brand.appUserId,
    });
  } catch {
    /* migráció még nem futott le */
  }

  await db.insert(notifications).values({
    userId: c.creatorUserId,
    type: "collab_changes",
    title: "Változtatást kértek 📝",
    body: `${c.brandName} változtatást kért: „${c.adTitle}".`,
    link: `/creator/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}

// ─────────────────────────── Workspace (chat + idővonal) ───────────────────

export type CollabEvent = {
  id: string;
  kind: string; // 'delivered' | 'changes_requested' | 'approved'
  note: string | null;
  byUserId: string | null;
  createdAt: Date;
};

export type CollabDetail = {
  id: string;
  status: string;
  acceptedAt: Date;
  deliveredAt: Date | null;
  completedAt: Date | null;
  adId: string;
  adTitle: string;
  viewerRole: "brand" | "creator";
  myUserId: string;
  otherUserId: string;
  partnerName: string;
  partnerAvatar: string | null;
  creatorReviewedByBrand: boolean; // a márka már értékelte a creatort (reviews)
  brandReviewedByCreator: boolean; // a creator már értékelte a márkát (brandReviews)
  events: CollabEvent[];
};

/** Egy együttműködés teljes adata a workspace-hez (csak a két résztvevő látja). */
export async function getCollaborationDetail(collabId: string): Promise<CollabDetail | null> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return null;

  const [c] = await db
    .select({
      id: collaborations.id,
      status: collaborations.status,
      acceptedAt: collaborations.acceptedAt,
      deliveredAt: collaborations.deliveredAt,
      completedAt: collaborations.completedAt,
      adId: collaborations.adId,
      adTitle: ads.title,
      brandUserId: brandProfiles.userId,
      creatorUserId: creatorProfiles.userId,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
      creatorName: creatorProfiles.displayName,
      creatorAvatar: creatorProfiles.avatarUrl,
    })
    .from(collaborations)
    .innerJoin(ads, eq(ads.id, collaborations.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(eq(collaborations.id, collabId))
    .limit(1);
  if (!c) return null;

  const myUserId = current.dbUser.id;
  const viewerRole: "brand" | "creator" | null =
    myUserId === c.brandUserId ? "brand" : myUserId === c.creatorUserId ? "creator" : null;
  if (!viewerRole) return null; // nem résztvevő

  const otherUserId = viewerRole === "brand" ? c.creatorUserId : c.brandUserId;
  const partnerName = viewerRole === "brand" ? c.creatorName : c.brandName;
  const partnerAvatar = viewerRole === "brand" ? c.creatorAvatar : c.brandLogo;

  let events: CollabEvent[] = [];
  try {
    events = await db
      .select({
        id: collaborationEvents.id,
        kind: collaborationEvents.kind,
        note: collaborationEvents.note,
        byUserId: collaborationEvents.byUserId,
        createdAt: collaborationEvents.createdAt,
      })
      .from(collaborationEvents)
      .where(eq(collaborationEvents.collaborationId, collabId))
      .orderBy(asc(collaborationEvents.createdAt));
  } catch {
    events = []; // migráció még nem futott le
  }

  const [revByBrand] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(eq(reviews.collaborationId, collabId))
    .limit(1);
  const [revByCreator] = await db
    .select({ id: brandReviews.id })
    .from(brandReviews)
    .where(eq(brandReviews.collaborationId, collabId))
    .limit(1);

  return {
    id: c.id,
    status: c.status,
    acceptedAt: c.acceptedAt,
    deliveredAt: c.deliveredAt,
    completedAt: c.completedAt,
    adId: c.adId,
    adTitle: c.adTitle,
    viewerRole,
    myUserId,
    otherUserId,
    partnerName,
    partnerAvatar,
    creatorReviewedByBrand: !!revByBrand,
    brandReviewedByCreator: !!revByCreator,
    events,
  };
}

export type CollabEventForThread = {
  id: string;
  kind: string;
  note: string | null;
  createdAt: Date;
  partnerUserId: string; // a beszélgetőpartner user-id-ja (a chat-szálhoz kötéshez)
  adTitle: string;
};

/**
 * Az aktuális user együttműködéseinek idővonal-eseményei, a beszélgetőpartner
 * szerint — hogy az "Üzenetek" beszélgetésében időrendben megjelenhessenek.
 */
export async function getMyCollabEvents(): Promise<CollabEventForThread[]> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return [];
  const myId = current.dbUser.id;

  try {
    const rows = await db
      .select({
        id: collaborationEvents.id,
        kind: collaborationEvents.kind,
        note: collaborationEvents.note,
        createdAt: collaborationEvents.createdAt,
        adTitle: ads.title,
        brandUserId: brandProfiles.userId,
        creatorUserId: creatorProfiles.userId,
      })
      .from(collaborationEvents)
      .innerJoin(collaborations, eq(collaborations.id, collaborationEvents.collaborationId))
      .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
      .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
      .innerJoin(ads, eq(ads.id, collaborations.adId))
      .where(or(eq(brandProfiles.userId, myId), eq(creatorProfiles.userId, myId)));

    return rows.map((r) => ({
      id: r.id,
      kind: r.kind,
      note: r.note,
      createdAt: r.createdAt,
      adTitle: r.adTitle,
      partnerUserId: r.brandUserId === myId ? r.creatorUserId : r.brandUserId,
    }));
  } catch {
    return []; // a collaboration_events migráció még nem futott le
  }
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

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "approved",
      byUserId: brand.appUserId,
    });
  } catch {
    /* migráció még nem futott le */
  }

  await db.insert(notifications).values({
    userId: c.creatorUserId,
    type: "collab_completed",
    title: "Jóváhagyva és lezárva ✅",
    body: `${c.brandName} jóváhagyta és lezárta: „${c.adTitle}". Köszönjük a közös munkát!`,
    link: `/creator/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}
