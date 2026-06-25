"use server";

import { z } from "zod";
import { desc, eq, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { creatorProjects, creatorProfiles, users, messages, notifications } from "@/lib/db/schema";
import { getCurrentCreator, getCurrentUser } from "@/lib/auth";
import { sendExpoPush } from "@/lib/push";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";

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
    link: "/creator/messages",
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
