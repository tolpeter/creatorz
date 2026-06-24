"use server";

import { and, asc, desc, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  collaborations,
  collaborationEvents,
  collaborationDeliverables,
  ads,
  creatorProfiles,
  brandProfiles,
  brandReviews,
  reviews,
  messages,
  users,
  notifications,
} from "@/lib/db/schema";
import { getCurrentUser, getCurrentBrand, getCurrentCreator } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

  // Új revíziós kör (a javított anyag külön körbe kerül).
  try {
    await db
      .update(collaborations)
      .set({ currentRound: sql`${collaborations.currentRound} + 1` })
      .where(eq(collaborations.id, collabId));
  } catch {
    /* migráció még nem futott le */
  }

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

export type CollabDeliverable = {
  id: string;
  url: string;
  title: string | null;
  note: string | null;
  round: number;
  createdAt: Date;
};

export type CollabMsg = {
  id: string;
  fromUserId: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
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
  // Megállapodás fázis:
  agreedDeadline: Date | null;
  agreementNote: string | null;
  agreedAt: Date | null;
  currentRound: number;
  deliverables: CollabDeliverable[];
  events: CollabEvent[];
  messages: CollabMsg[];
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

  // Megállapodás-mezők + revíziós kör — külön, rezíliens lekérés (ha a
  // migráció még nem futott, az alapnézet akkor is működik).
  let agreedDeadline: Date | null = null;
  let agreementNote: string | null = null;
  let agreedAt: Date | null = null;
  let currentRound = 1;
  try {
    const [a] = await db
      .select({
        agreedDeadline: collaborations.agreedDeadline,
        agreementNote: collaborations.agreementNote,
        agreedAt: collaborations.agreedAt,
        currentRound: collaborations.currentRound,
      })
      .from(collaborations)
      .where(eq(collaborations.id, collabId))
      .limit(1);
    if (a) {
      agreedDeadline = a.agreedDeadline;
      agreementNote = a.agreementNote;
      agreedAt = a.agreedAt;
      currentRound = a.currentRound ?? 1;
    }
  } catch {
    /* migráció még nem futott le */
  }

  let deliverables: CollabDeliverable[] = [];
  try {
    deliverables = await db
      .select({
        id: collaborationDeliverables.id,
        url: collaborationDeliverables.url,
        title: collaborationDeliverables.title,
        note: collaborationDeliverables.note,
        round: collaborationDeliverables.round,
        createdAt: collaborationDeliverables.createdAt,
      })
      .from(collaborationDeliverables)
      .where(eq(collaborationDeliverables.collaborationId, collabId))
      .orderBy(asc(collaborationDeliverables.createdAt));
  } catch {
    deliverables = [];
  }

  // Beágyazott beszélgetés: a két fél közti üzenetek (folyamatos kapcsolattartás).
  const msgs = await db
    .select({
      id: messages.id,
      fromUserId: messages.fromUserId,
      body: messages.body,
      attachmentUrl: messages.attachmentUrl,
      attachmentName: messages.attachmentName,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, c.brandUserId), eq(messages.toUserId, c.creatorUserId)),
        and(eq(messages.fromUserId, c.creatorUserId), eq(messages.toUserId, c.brandUserId)),
      ),
    )
    .orderBy(asc(messages.createdAt));

  // A nekem szóló, partnertől jövő olvasatlanokat olvasottra állítjuk.
  await db
    .update(messages)
    .set({ read: true })
    .where(
      and(
        eq(messages.toUserId, myUserId),
        eq(messages.fromUserId, otherUserId),
        eq(messages.read, false),
      ),
    );

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
    agreedDeadline,
    agreementNote,
    agreedAt,
    currentRound,
    deliverables,
    events,
    messages: msgs,
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

// ─────────────────────────── Pro workspace actions ─────────────────────────

/** Belső segéd: az együttműködés + a két fél azonosítói (jogosultság-ellenőrzéshez). */
async function loadCollab(collabId: string) {
  const [c] = await db
    .select({
      id: collaborations.id,
      status: collaborations.status,
      completedAt: collaborations.completedAt,
      adTitle: ads.title,
      brandUserId: brandProfiles.userId,
      creatorUserId: creatorProfiles.userId,
      brandName: brandProfiles.companyName,
      creatorName: creatorProfiles.displayName,
    })
    .from(collaborations)
    .innerJoin(ads, eq(ads.id, collaborations.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .where(eq(collaborations.id, collabId))
    .limit(1);
  return c ?? null;
}

/** Az aktuális revíziós kör (rezíliens — migráció előtt 1). */
async function currentRoundOf(collabId: string): Promise<number> {
  try {
    const [a] = await db
      .select({ r: collaborations.currentRound })
      .from(collaborations)
      .where(eq(collaborations.id, collabId))
      .limit(1);
    return a?.r ?? 1;
  } catch {
    return 1;
  }
}

/** Márka: megállapodási feltételeket javasol (mit vár, határidő). */
export async function proposeAgreement(
  collabId: string,
  input: { deadline?: string | null; note: string },
) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak márka javasolhat megállapodást." };

  const note = (input.note ?? "").trim();
  if (note.length < 5) return { error: "Írd le a megállapodás feltételeit (legalább 5 karakter)." };

  const c = await loadCollab(collabId);
  if (!c || c.brandUserId !== brand.appUserId) return { error: "Az együttműködés nem található." };
  if (c.completedAt) return { error: "Lezárt együttműködésnél már nem módosítható a megállapodás." };

  let deadline: Date | null = null;
  if (input.deadline) {
    const d = new Date(input.deadline);
    if (!isNaN(d.getTime())) deadline = d;
  }

  try {
    await db
      .update(collaborations)
      .set({ agreementNote: note.slice(0, 2000), agreedDeadline: deadline, agreedAt: null })
      .where(eq(collaborations.id, collabId));
  } catch {
    return { error: "A megállapodás funkció még nincs aktiválva (adatbázis-migráció szükséges)." };
  }

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "agreement_proposed",
      note: note.slice(0, 1000),
      byUserId: brand.appUserId,
    });
  } catch {
    /* migráció még nem futott le */
  }

  await db.insert(notifications).values({
    userId: c.creatorUserId,
    type: "collab_agreement",
    title: "Megállapodási javaslat 📋",
    body: `${c.brandName} feltételeket javasolt: „${c.adTitle}". Nézd át és fogadd el.`,
    link: `/creator/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  return { success: true };
}

/** Creator: elfogadja a márka megállapodási javaslatát. */
export async function acceptAgreement(collabId: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak tartalomgyártó fogadhatja el a megállapodást." };

  const c = await loadCollab(collabId);
  if (!c || c.creatorUserId !== creator.appUserId) return { error: "Az együttműködés nem található." };

  let hasProposal = false;
  try {
    const [a] = await db
      .select({ note: collaborations.agreementNote })
      .from(collaborations)
      .where(eq(collaborations.id, collabId))
      .limit(1);
    hasProposal = !!a?.note?.trim();
  } catch {
    return { error: "A megállapodás funkció még nincs aktiválva (adatbázis-migráció szükséges)." };
  }
  if (!hasProposal) return { error: "A márka még nem javasolt megállapodást." };

  await db
    .update(collaborations)
    .set({ agreedAt: new Date() })
    .where(eq(collaborations.id, collabId));

  try {
    await db.insert(collaborationEvents).values({
      collaborationId: collabId,
      kind: "agreement_accepted",
      byUserId: creator.appUserId,
    });
  } catch {
    /* migráció még nem futott le */
  }

  await db.insert(notifications).values({
    userId: c.brandUserId,
    type: "collab_agreement",
    title: "Megállapodás elfogadva 🤝",
    body: `${c.creatorName} elfogadta a megállapodást: „${c.adTitle}". Kezdődhet a munka!`,
    link: `/brand/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  return { success: true };
}

/** Creator: kész anyag-linket ad hozzá az aktuális revíziós körhöz. */
export async function addDeliverable(
  collabId: string,
  input: { url: string; title?: string | null; note?: string | null },
) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak tartalomgyártó adhat hozzá kész anyagot." };

  const c = await loadCollab(collabId);
  if (!c || c.creatorUserId !== creator.appUserId) return { error: "Az együttműködés nem található." };
  if (c.completedAt) return { error: "Lezárt együttműködéshez már nem adható anyag." };

  const url = (input.url ?? "").trim();
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) {
    return { error: "Adj meg egy érvényes linket (pl. https://drive.google.com/...)." };
  }

  const round = await currentRoundOf(collabId);
  try {
    await db.insert(collaborationDeliverables).values({
      collaborationId: collabId,
      url: url.slice(0, 2000),
      title: input.title?.trim()?.slice(0, 200) || null,
      note: input.note?.trim()?.slice(0, 1000) || null,
      round,
    });
  } catch {
    return { error: "A kész-anyag funkció még nincs aktiválva (adatbázis-migráció szükséges)." };
  }

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  return { success: true };
}

/** Creator: töröl egy korábban hozzáadott linket (csak lezárás előtt). */
export async function removeDeliverable(deliverableId: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs jogosultság." };

  try {
    const [d] = await db
      .select({
        collabId: collaborationDeliverables.collaborationId,
        creatorUserId: creatorProfiles.userId,
        completedAt: collaborations.completedAt,
      })
      .from(collaborationDeliverables)
      .innerJoin(collaborations, eq(collaborations.id, collaborationDeliverables.collaborationId))
      .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
      .where(eq(collaborationDeliverables.id, deliverableId))
      .limit(1);
    if (!d || d.creatorUserId !== creator.appUserId) return { error: "Nem található." };
    if (d.completedAt) return { error: "Lezárt együttműködésből nem törölhető." };

    await db.delete(collaborationDeliverables).where(eq(collaborationDeliverables.id, deliverableId));
    revalidatePath(`/creator/collaborations/${d.collabId}`);
    revalidatePath(`/brand/collaborations/${d.collabId}`);
    return { success: true };
  } catch {
    return { error: "Nem sikerült törölni." };
  }
}

/** Creator: leadja az aktuális kört (legalább 1 link szükséges). */
export async function submitDelivery(collabId: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Csak tartalomgyártó adhatja le a munkát." };

  const c = await loadCollab(collabId);
  if (!c || c.creatorUserId !== creator.appUserId) return { error: "Az együttműködés nem található." };
  if (c.completedAt) return { error: "Az együttműködés már lezárult." };

  const round = await currentRoundOf(collabId);
  let count = 0;
  try {
    const rows = await db
      .select({ id: collaborationDeliverables.id })
      .from(collaborationDeliverables)
      .where(
        and(
          eq(collaborationDeliverables.collaborationId, collabId),
          eq(collaborationDeliverables.round, round),
        ),
      );
    count = rows.length;
  } catch {
    return { error: "A kész-anyag funkció még nincs aktiválva (adatbázis-migráció szükséges)." };
  }
  if (count === 0) return { error: "Adj hozzá legalább egy linket a leadáshoz." };

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
    /* migráció még nem futott le */
  }

  await db.insert(notifications).values({
    userId: c.brandUserId,
    type: "collab_delivered",
    title: "A tartalomgyártó leadta a munkát 📦",
    body: `${c.creatorName} leadta: „${c.adTitle}". Nézd át a linkeket, és hagyd jóvá vagy kérj változtatást.`,
    link: `/brand/collaborations/${collabId}`,
  });

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  revalidatePath("/creator/collaborations");
  revalidatePath("/brand/collaborations");
  return { success: true };
}

/**
 * A workspace-ből küldött üzenet — mindkét fél írhat (folyamatos kapcsolattartás).
 * A beszélgetés az "Üzenetek" menüben is megjelenik (ugyanaz a messages tábla).
 */
export async function sendCollabMessage(collabId: string, body: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };

  const text = (body ?? "").trim();
  if (!text) return { error: "Üres üzenet — írj valamit." };

  const c = await loadCollab(collabId);
  if (!c) return { error: "Az együttműködés nem található." };

  const myUserId = current.dbUser.id;
  const otherUserId =
    myUserId === c.brandUserId ? c.creatorUserId : myUserId === c.creatorUserId ? c.brandUserId : null;
  if (!otherUserId) return { error: "Nincs jogosultság." };

  const iAmBrand = myUserId === c.brandUserId;
  const meName = iAmBrand ? c.brandName : c.creatorName;
  const link = iAmBrand ? "/creator/messages" : "/brand/messages";

  // Címzett email a throttle-olt email-értesítéshez.
  const [recipient] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, otherUserId))
    .limit(1);

  await db.insert(messages).values({
    fromUserId: myUserId,
    toUserId: otherUserId,
    body: text.slice(0, 4000),
  });

  await db.insert(notifications).values({
    userId: otherUserId,
    type: "message",
    title: `Új üzenet: ${meName}`,
    body: text.slice(0, 120),
    link,
  });

  await sendExpoPush([otherUserId], {
    title: meName,
    body: text.slice(0, 140),
    data: { type: "message", partnerId: myUserId },
  });

  if (recipient?.email) {
    const email = renderNewMessageEmail({
      recipientName: iAmBrand ? c.creatorName : c.brandName,
      senderName: meName,
      preview: text.slice(0, 220),
      inboxUrl: `${APP_URL}${link}`,
    });
    await sendMessageEmailThrottled(otherUserId, recipient.email, email);
  }

  revalidatePath(`/creator/collaborations/${collabId}`);
  revalidatePath(`/brand/collaborations/${collabId}`);
  revalidatePath("/creator/messages");
  revalidatePath("/brand/messages");
  return { success: true };
}
