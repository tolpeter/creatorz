"use server";

import { z } from "zod";
import { and, asc, desc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  creatorProjects,
  creatorProjectDeliverables,
  creatorProjectReviews,
  creatorProfiles,
  users,
  messages,
  notifications,
} from "@/lib/db/schema";
import { getCurrentCreator, getCurrentUser } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";
import { recalcCreatorRating } from "@/lib/creator-rating";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const schema = z.object({
  partnerUsername: z.string().min(1),
  title: z.string().min(3, "A projekt címe legalább 3 karakter").max(160),
  note: z.string().max(1000).optional().or(z.literal("")),
});

/** Egy alkotó közös munkára hív egy másik alkotót (márka nélkül). */
export async function requestCreatorProject(input: z.input<typeof schema>) {
  const me = await getCurrentCreator();
  if (!me) return { error: "Csak bejelentkezett alkotó küldhet felkérést." };

  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  const d = parsed.data;

  const [partner] = await db
    .select({
      id: creatorProfiles.id,
      userId: creatorProfiles.userId,
      name: creatorProfiles.displayName,
      email: users.email,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.username, d.partnerUsername))
    .limit(1);
  if (!partner) return { error: "A megadott alkotó nem található." };
  if (partner.userId === me.appUserId) return { error: "Magadat nem hívhatod meg." };

  await db.insert(creatorProjects).values({
    requesterId: me.profile.id,
    partnerId: partner.id,
    requesterUserId: me.appUserId,
    partnerUserId: partner.userId,
    title: d.title,
    note: d.note || null,
  });

  // Megnyitó üzenet → ettől létrejön a beszélgetés, és a partner válaszolhat.
  const body = `Közös munkára hívlak: „${d.title}".${d.note ? ` ${d.note}` : ""}`;
  await db.insert(messages).values({
    fromUserId: me.appUserId,
    toUserId: partner.userId,
    body: body.slice(0, 4000),
  });

  await db.insert(notifications).values({
    userId: partner.userId,
    type: "creator_project",
    title: "Közös munkára hívtak 🤝",
    body: `${me.profile.displayName} közös munkára hívott: „${d.title}".`,
    link: "/creator/projects",
  });

  await sendExpoPush([partner.userId], {
    title: me.profile.displayName,
    body: `Közös munkára hívott: „${d.title}"`,
    data: { type: "message", partnerId: me.appUserId },
  });

  if (partner.email) {
    const email = renderNewMessageEmail({
      recipientName: partner.name,
      senderName: me.profile.displayName,
      preview: body.slice(0, 220),
      inboxUrl: `${APP_URL}/creator/messages`,
    });
    await sendMessageEmailThrottled(partner.userId, partner.email, email);
  }

  revalidatePath("/creator/projects");
  revalidatePath("/creator/messages");
  return { success: true };
}

/** Közös projekt lezárása (bármelyik résztvevő). */
export async function closeCreatorProject(projectId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const myId = current.dbUser.id;

  const [p] = await db
    .select({
      id: creatorProjects.id,
      requesterUserId: creatorProjects.requesterUserId,
      partnerUserId: creatorProjects.partnerUserId,
      title: creatorProjects.title,
      completedAt: creatorProjects.completedAt,
    })
    .from(creatorProjects)
    .where(eq(creatorProjects.id, projectId))
    .limit(1);
  if (!p) return { error: "A projekt nem található." };
  if (p.requesterUserId !== myId && p.partnerUserId !== myId)
    return { error: "Nincs jogosultság." };
  if (p.completedAt) return { success: true };

  await db
    .update(creatorProjects)
    .set({ status: "closed", completedAt: new Date() })
    .where(eq(creatorProjects.id, projectId));

  const otherUserId = p.requesterUserId === myId ? p.partnerUserId : p.requesterUserId;
  await db.insert(notifications).values({
    userId: otherUserId,
    type: "creator_project",
    title: "Közös projekt lezárva ✅",
    body: `A(z) „${p.title}" közös projekt lezárult.`,
    link: "/creator/projects",
  });

  revalidatePath("/creator/projects");
  return { success: true };
}

export type CreatorProjectItem = {
  id: string;
  title: string;
  note: string | null;
  status: string;
  createdAt: Date;
  iAmRequester: boolean;
  partnerUserId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string | null;
};

/** A bejelentkezett alkotó közös projektjei (kérő VAGY partner oldalon). */
export async function getMyCreatorProjects(): Promise<CreatorProjectItem[]> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return [];
  const myId = current.dbUser.id;

  // A projekt-értesítéseket olvasottra állítjuk (a bal oldali jelzés eltűnik).
  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, myId),
          eq(notifications.read, false),
          eq(notifications.type, "creator_project"),
        ),
      );
  } catch {
    /* best-effort */
  }

  const requesterCp = creatorProfiles;
  try {
    const rows = await db
      .select({
        id: creatorProjects.id,
        title: creatorProjects.title,
        note: creatorProjects.note,
        status: creatorProjects.status,
        createdAt: creatorProjects.createdAt,
        requesterUserId: creatorProjects.requesterUserId,
        partnerUserId: creatorProjects.partnerUserId,
        rName: requesterCp.displayName,
        rUsername: requesterCp.username,
        rAvatar: requesterCp.avatarUrl,
      })
      .from(creatorProjects)
      .innerJoin(requesterCp, eq(requesterCp.id, creatorProjects.requesterId))
      .where(or(eq(creatorProjects.requesterUserId, myId), eq(creatorProjects.partnerUserId, myId)))
      .orderBy(desc(creatorProjects.createdAt));

    // Ahol én vagyok a kérő, a partner adatai kellenek (partnerUserId szerint).
    const needUserIds = Array.from(
      new Set(rows.filter((r) => r.requesterUserId === myId).map((r) => r.partnerUserId)),
    );
    const partnerProfiles = needUserIds.length
      ? await db
          .select({
            userId: creatorProfiles.userId,
            name: creatorProfiles.displayName,
            username: creatorProfiles.username,
            avatar: creatorProfiles.avatarUrl,
          })
          .from(creatorProfiles)
          .where(inArray(creatorProfiles.userId, needUserIds))
      : [];
    const byUser = new Map(partnerProfiles.map((p) => [p.userId, p]));

    return rows.map((r) => {
      const iAmRequester = r.requesterUserId === myId;
      const otherUserId = iAmRequester ? r.partnerUserId : r.requesterUserId;
      const other = byUser.get(otherUserId);
      return {
        id: r.id,
        title: r.title,
        note: r.note,
        status: r.status,
        createdAt: r.createdAt,
        iAmRequester,
        partnerUserId: otherUserId,
        partnerName: iAmRequester ? other?.name ?? "Alkotó" : r.rName,
        partnerUsername: iAmRequester ? other?.username ?? "" : r.rUsername,
        partnerAvatar: iAmRequester ? other?.avatar ?? null : r.rAvatar,
      };
    });
  } catch {
    return [];
  }
}

// ─────────────────────── Pro workspace (a márkás folyamat tükre) ────────────
// Szerepek: requester ≈ "márka" (megállapodást javasol, jóváhagy), partner ≈
// "alkotó" (megállapodást elfogad, anyagot ad le). Lezárás CSAK kölcsönös értékelésre.

const APPURL2 = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export type ProjectDeliverable = {
  id: string;
  url: string;
  title: string | null;
  note: string | null;
  round: number;
  createdAt: Date;
};
export type ProjectMsg = {
  id: string;
  fromUserId: string;
  body: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  createdAt: Date;
};
export type ProjectDetail = {
  id: string;
  status: string;
  title: string;
  note: string | null;
  viewerRole: "requester" | "partner";
  myUserId: string;
  otherUserId: string;
  otherName: string;
  otherAvatar: string | null;
  agreementNote: string | null;
  agreedDeadline: Date | null;
  agreedAt: Date | null;
  deliveredAt: Date | null;
  approvedAt: Date | null;
  completedAt: Date | null;
  currentRound: number;
  deliverables: ProjectDeliverable[];
  messages: ProjectMsg[];
  myReviewDone: boolean;
  otherReviewDone: boolean;
};

async function loadProjectRow(projectId: string) {
  const [p] = await db
    .select()
    .from(creatorProjects)
    .where(eq(creatorProjects.id, projectId))
    .limit(1);
  return p ?? null;
}

/** Egy közös projekt teljes adata a workspace-hez (csak a két résztvevő látja). */
export async function getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
  const current = await getCurrentUser();
  if (!current?.dbUser) return null;
  const myUserId = current.dbUser.id;

  const p = await loadProjectRow(projectId);
  if (!p) return null;
  const viewerRole: "requester" | "partner" | null =
    myUserId === p.requesterUserId ? "requester" : myUserId === p.partnerUserId ? "partner" : null;
  if (!viewerRole) return null;
  const otherUserId = viewerRole === "requester" ? p.partnerUserId : p.requesterUserId;

  const profs = await db
    .select({ userId: creatorProfiles.userId, name: creatorProfiles.displayName, avatar: creatorProfiles.avatarUrl })
    .from(creatorProfiles)
    .where(inArray(creatorProfiles.userId, [p.requesterUserId, p.partnerUserId]));
  const other = profs.find((x) => x.userId === otherUserId);

  let deliverables: ProjectDeliverable[] = [];
  try {
    deliverables = await db
      .select({
        id: creatorProjectDeliverables.id,
        url: creatorProjectDeliverables.url,
        title: creatorProjectDeliverables.title,
        note: creatorProjectDeliverables.note,
        round: creatorProjectDeliverables.round,
        createdAt: creatorProjectDeliverables.createdAt,
      })
      .from(creatorProjectDeliverables)
      .where(eq(creatorProjectDeliverables.projectId, projectId))
      .orderBy(asc(creatorProjectDeliverables.createdAt));
  } catch {
    deliverables = [];
  }

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
        and(eq(messages.fromUserId, p.requesterUserId), eq(messages.toUserId, p.partnerUserId)),
        and(eq(messages.fromUserId, p.partnerUserId), eq(messages.toUserId, p.requesterUserId)),
      ),
    )
    .orderBy(asc(messages.createdAt));

  let reviewerIds: string[] = [];
  try {
    const revs = await db
      .select({ r: creatorProjectReviews.reviewerUserId })
      .from(creatorProjectReviews)
      .where(eq(creatorProjectReviews.projectId, projectId));
    reviewerIds = revs.map((r) => r.r);
  } catch {
    reviewerIds = [];
  }

  try {
    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, myUserId),
          eq(notifications.read, false),
          eq(notifications.type, "creator_project"),
        ),
      );
  } catch {
    /* best-effort */
  }

  return {
    id: p.id,
    status: p.status,
    title: p.title,
    note: p.note,
    viewerRole,
    myUserId,
    otherUserId,
    otherName: other?.name ?? "Alkotó",
    otherAvatar: other?.avatar ?? null,
    agreementNote: p.agreementNote ?? null,
    agreedDeadline: p.agreedDeadline ?? null,
    agreedAt: p.agreedAt ?? null,
    deliveredAt: p.deliveredAt ?? null,
    approvedAt: p.approvedAt ?? null,
    completedAt: p.completedAt ?? null,
    currentRound: p.currentRound ?? 1,
    deliverables,
    messages: msgs,
    myReviewDone: reviewerIds.includes(myUserId),
    otherReviewDone: reviewerIds.includes(otherUserId),
  };
}

async function notifyProject(userId: string, title: string, body: string) {
  try {
    await db.insert(notifications).values({ userId, type: "creator_project", title, body, link: "/creator/projects" });
  } catch {
    /* best-effort */
  }
}

/** Felkérő: megállapodást javasol. */
export async function proposeProjectAgreement(projectId: string, input: { note: string; deadline?: string | null }) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.requesterUserId !== current.dbUser.id) return { error: "Csak a felkérő javasolhat megállapodást." };
  if (p.completedAt) return { error: "Lezárt projektnél nem módosítható." };
  const note = (input.note ?? "").trim();
  if (note.length < 5) return { error: "Írd le a megállapodás feltételeit (min. 5 karakter)." };

  let deadline: Date | null = null;
  if (input.deadline) {
    const d = new Date(input.deadline);
    if (!isNaN(d.getTime())) deadline = d;
  }
  await db.update(creatorProjects).set({ agreementNote: note.slice(0, 2000), agreedDeadline: deadline, agreedAt: null }).where(eq(creatorProjects.id, projectId));
  await notifyProject(p.partnerUserId, "Megállapodási javaslat 📋", `Feltételeket javasoltak: „${p.title}". Nézd át és fogadd el.`);
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

/** Partner: elfogadja a megállapodást. */
export async function acceptProjectAgreement(projectId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.partnerUserId !== current.dbUser.id) return { error: "Csak a partner fogadhatja el." };
  if (!p.agreementNote?.trim()) return { error: "Még nincs megállapodási javaslat." };
  await db.update(creatorProjects).set({ agreedAt: new Date() }).where(eq(creatorProjects.id, projectId));
  await notifyProject(p.requesterUserId, "Megállapodás elfogadva 🤝", `Elfogadták a megállapodást: „${p.title}". Kezdődhet a munka!`);
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

async function currentRoundOfProject(projectId: string): Promise<number> {
  try {
    const [a] = await db.select({ r: creatorProjects.currentRound }).from(creatorProjects).where(eq(creatorProjects.id, projectId)).limit(1);
    return a?.r ?? 1;
  } catch {
    return 1;
  }
}

/** Partner: kész anyag-linket ad hozzá. */
export async function addProjectDeliverable(projectId: string, input: { url: string; title?: string | null }) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.partnerUserId !== current.dbUser.id) return { error: "Csak a partner adhat hozzá anyagot." };
  if (p.completedAt) return { error: "Lezárt projekthez nem adható." };
  const url = (input.url ?? "").trim();
  if (!/^https?:\/\/\S+\.\S+/i.test(url)) return { error: "Adj meg egy érvényes linket (https://...)." };
  const round = await currentRoundOfProject(projectId);
  try {
    await db.insert(creatorProjectDeliverables).values({ projectId, url: url.slice(0, 2000), title: input.title?.trim()?.slice(0, 200) || null, round });
  } catch {
    return { error: "A funkció még nincs aktiválva (migráció szükséges)." };
  }
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

export async function removeProjectDeliverable(deliverableId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs jogosultság." };
  try {
    const [d] = await db
      .select({ projectId: creatorProjectDeliverables.projectId, partnerUserId: creatorProjects.partnerUserId, completedAt: creatorProjects.completedAt })
      .from(creatorProjectDeliverables)
      .innerJoin(creatorProjects, eq(creatorProjects.id, creatorProjectDeliverables.projectId))
      .where(eq(creatorProjectDeliverables.id, deliverableId))
      .limit(1);
    if (!d || d.partnerUserId !== current.dbUser.id) return { error: "Nem található." };
    if (d.completedAt) return { error: "Lezárt projektből nem törölhető." };
    await db.delete(creatorProjectDeliverables).where(eq(creatorProjectDeliverables.id, deliverableId));
    revalidatePath(`/creator/projects/${d.projectId}`);
    return { success: true };
  } catch {
    return { error: "Nem sikerült törölni." };
  }
}

/** Partner: leadja az aktuális kört (legalább 1 link). */
export async function submitProjectDelivery(projectId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.partnerUserId !== current.dbUser.id) return { error: "Csak a partner adhatja le." };
  if (p.completedAt) return { error: "A projekt már lezárult." };
  const round = await currentRoundOfProject(projectId);
  let count = 0;
  try {
    const rows = await db.select({ id: creatorProjectDeliverables.id }).from(creatorProjectDeliverables).where(and(eq(creatorProjectDeliverables.projectId, projectId), eq(creatorProjectDeliverables.round, round)));
    count = rows.length;
  } catch {
    return { error: "A funkció még nincs aktiválva (migráció szükséges)." };
  }
  if (count === 0) return { error: "Adj hozzá legalább egy linket a leadáshoz." };
  await db.update(creatorProjects).set({ deliveredAt: new Date() }).where(eq(creatorProjects.id, projectId));
  await notifyProject(p.requesterUserId, "Leadták a munkát 📦", `Leadták: „${p.title}". Nézd át és hagyd jóvá vagy kérj változtatást.`);
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

/** Felkérő: változtatást kér (új revíziós kör). */
export async function requestProjectChanges(projectId: string, note: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.requesterUserId !== current.dbUser.id) return { error: "Csak a felkérő kérhet változtatást." };
  if (p.completedAt) return { error: "Lezárt projektnél nem kérhetsz változtatást." };
  await db.update(creatorProjects).set({ deliveredAt: null }).where(eq(creatorProjects.id, projectId));
  try {
    await db.update(creatorProjects).set({ currentRound: (p.currentRound ?? 1) + 1 }).where(eq(creatorProjects.id, projectId));
  } catch {
    /* migráció */
  }
  await notifyProject(p.partnerUserId, "Változtatást kértek 📝", `Változtatást kértek: „${p.title}".${note?.trim() ? ` ${note.trim().slice(0, 200)}` : ""}`);
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

/** Felkérő: jóváhagyja a munkát → értékelési fázis (review_pending). */
export async function approveProjectWork(projectId: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const p = await loadProjectRow(projectId);
  if (!p || p.requesterUserId !== current.dbUser.id) return { error: "Csak a felkérő hagyhatja jóvá." };
  if (p.completedAt) return { error: "A projekt már lezárult." };
  if (!p.deliveredAt) return { error: "Előbb a partnernek le kell adnia a munkát." };
  await db.update(creatorProjects).set({ approvedAt: new Date(), status: "review_pending" }).where(eq(creatorProjects.id, projectId));
  await notifyProject(p.partnerUserId, "A munkát jóváhagyták 🎉", `Jóváhagyták: „${p.title}". Írj véleményt — ez kell a lezáráshoz.`);
  await notifyProject(p.requesterUserId, "Értékelj — a lezáráshoz kell 📝", `Hátravan a véleményed: „${p.title}".`);
  revalidatePath(`/creator/projects/${projectId}`);
  return { success: true };
}

async function closeProjectIfBothReviewed(projectId: string): Promise<boolean> {
  const p = await loadProjectRow(projectId);
  if (!p || p.completedAt) return false;
  let count = 0;
  try {
    const revs = await db.select({ r: creatorProjectReviews.reviewerUserId }).from(creatorProjectReviews).where(eq(creatorProjectReviews.projectId, projectId));
    const ids = new Set(revs.map((r) => r.r));
    count = (ids.has(p.requesterUserId) ? 1 : 0) + (ids.has(p.partnerUserId) ? 1 : 0);
  } catch {
    return false;
  }
  if (count < 2) return false;
  await db.update(creatorProjects).set({ status: "closed", completedAt: new Date() }).where(eq(creatorProjects.id, projectId));
  await notifyProject(p.requesterUserId, "Közös projekt lezárva ✅", `Mindketten értékeltetek: „${p.title}". A projekt lezárult.`);
  await notifyProject(p.partnerUserId, "Közös projekt lezárva ✅", `Mindketten értékeltetek: „${p.title}". A projekt lezárult.`);
  return true;
}

/** Bármelyik fél értékel; a második értékeléskor lezárul (KÖTELEZŐ kölcsönös). */
export async function submitProjectReview(projectId: string, input: { overallRating: number; text: string }) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const myUserId = current.dbUser.id;
  const p = await loadProjectRow(projectId);
  if (!p) return { error: "A projekt nem található." };
  if (p.requesterUserId !== myUserId && p.partnerUserId !== myUserId) return { error: "Nincs jogosultság." };
  const approved = !!p.approvedAt || p.status === "review_pending" || p.status === "closed" || !!p.completedAt;
  if (!approved) return { error: "Akkor értékelhetsz, ha a munkát már jóváhagyták." };
  const rating = Number(input.overallRating);
  if (!(rating >= 1 && rating <= 5)) return { error: "Adj 1–5 csillagot." };
  const text = (input.text ?? "").trim();
  if (text.length < 10) return { error: "Az értékelés legalább 10 karakter." };

  // Kit értékelek: a másik fél (a publikus megjelenítéshez + csillag-átlaghoz).
  const iAmRequester = myUserId === p.requesterUserId;
  const revieweeId = iAmRequester ? p.partnerId : p.requesterId;
  const revieweeUserId = iAmRequester ? p.partnerUserId : p.requesterUserId;

  try {
    await db
      .insert(creatorProjectReviews)
      .values({
        projectId,
        reviewerUserId: myUserId,
        revieweeId,
        revieweeUserId,
        overallRating: rating,
        text: text.slice(0, 2000),
      })
      .onConflictDoNothing({ target: [creatorProjectReviews.projectId, creatorProjectReviews.reviewerUserId] });
  } catch {
    return { error: "A funkció még nincs aktiválva (migráció szükséges)." };
  }
  // A publikus csillag-átlag frissítése (most már a projekt-értékelés is beleszámít).
  try {
    await recalcCreatorRating(revieweeId);
  } catch {
    /* best-effort */
  }
  const closed = await closeProjectIfBothReviewed(projectId);
  revalidatePath(`/creator/projects/${projectId}`);
  revalidatePath("/creator/projects");
  return { success: true, closed };
}

/** Beágyazott üzenet a workspace-ből (a két fél között). */
export async function sendProjectMessage(projectId: string, body: string) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Be kell jelentkezned." };
  const myUserId = current.dbUser.id;
  const text = (body ?? "").trim();
  if (!text) return { error: "Üres üzenet." };
  const p = await loadProjectRow(projectId);
  if (!p) return { error: "A projekt nem található." };
  const otherUserId = myUserId === p.requesterUserId ? p.partnerUserId : myUserId === p.partnerUserId ? p.requesterUserId : null;
  if (!otherUserId) return { error: "Nincs jogosultság." };

  const [me] = await db.select({ name: creatorProfiles.displayName }).from(creatorProfiles).where(eq(creatorProfiles.userId, myUserId)).limit(1);
  const [recipient] = await db.select({ email: users.email }).from(users).where(eq(users.id, otherUserId)).limit(1);
  const meName = me?.name ?? "Alkotó";

  await db.insert(messages).values({ fromUserId: myUserId, toUserId: otherUserId, body: text.slice(0, 4000) });
  await db.insert(notifications).values({ userId: otherUserId, type: "message", title: `Új üzenet: ${meName}`, body: text.slice(0, 120), link: "/creator/messages" });
  await sendExpoPush([otherUserId], { title: meName, body: text.slice(0, 140), data: { type: "message", partnerId: myUserId } });
  if (recipient?.email) {
    const email = renderNewMessageEmail({ recipientName: "Alkotó", senderName: meName, preview: text.slice(0, 220), inboxUrl: `${APPURL2}/creator/messages` });
    await sendMessageEmailThrottled(otherUserId, recipient.email, email);
  }
  revalidatePath(`/creator/projects/${projectId}`);
  revalidatePath("/creator/messages");
  return { success: true };
}

export type PublicProjectReview = {
  reviewerName: string;
  reviewerUsername: string;
  reviewerAvatar: string | null;
  overallRating: number;
  text: string;
  createdAt: Date;
};

/** Egy alkotóról írt nyilvános, alkotótársi (közös projekt) értékelések. */
export async function getPublicProjectReviews(creatorProfileId: string): Promise<PublicProjectReview[]> {
  try {
    const rows = await db
      .select({
        overallRating: creatorProjectReviews.overallRating,
        text: creatorProjectReviews.text,
        createdAt: creatorProjectReviews.createdAt,
        name: creatorProfiles.displayName,
        username: creatorProfiles.username,
        avatar: creatorProfiles.avatarUrl,
      })
      .from(creatorProjectReviews)
      .innerJoin(creatorProfiles, eq(creatorProfiles.userId, creatorProjectReviews.reviewerUserId))
      .where(eq(creatorProjectReviews.revieweeId, creatorProfileId))
      .orderBy(desc(creatorProjectReviews.createdAt))
      .limit(12);
    return rows.map((r) => ({
      reviewerName: r.name,
      reviewerUsername: r.username,
      reviewerAvatar: r.avatar,
      overallRating: r.overallRating,
      text: r.text,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}
