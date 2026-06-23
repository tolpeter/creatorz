"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import {
  creatorProfiles,
  brandProfiles,
  users,
  messages,
  notifications,
} from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getCurrentBrand } from "@/lib/auth";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";
import { sendExpoPush } from "@/lib/push";
import { formatHuf } from "@/lib/utils/format";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ===========================================================================
// Márka → tartalomgyártó *induló* üzenet (a profil oldali "Üzenetet küldök")
// ===========================================================================

const initSchema = z.object({
  toUsername: z.string().min(1),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Az üzenet nem lehet üres").max(5000),
  budgetHint: z.coerce.number().int().min(0).optional().nullable(),
});

export async function sendMessage(input: z.input<typeof initSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka küldhet üzenetet" };

  const parsed = initSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const rows = await db
    .select({
      creatorUserId: creatorProfiles.userId,
      displayName: creatorProfiles.displayName,
      email: users.email,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.username, d.toUsername))
    .limit(1);

  const recipient = rows[0];
  if (!recipient) return { error: "A címzett tartalomgyártó nem található" };

  await db.insert(messages).values({
    fromUserId: brand.appUserId,
    toUserId: recipient.creatorUserId,
    subject: d.subject || null,
    body: d.body,
    budgetHint: d.budgetHint ?? null,
  });

  await db.insert(notifications).values({
    userId: recipient.creatorUserId,
    type: "message",
    title: `Új üzenet: ${brand.profile.companyName}`,
    body: d.subject || d.body.slice(0, 120),
    link: "/creator/messages",
  });

  await sendExpoPush([recipient.creatorUserId], {
    title: brand.profile.companyName,
    body: (d.subject ? `${d.subject} — ` : "") + d.body.slice(0, 140),
    data: { type: "message", partnerId: brand.appUserId },
  });

  {
    const previewParts = [d.subject, d.body.slice(0, 200)].filter(Boolean);
    const previewLine = d.budgetHint
      ? `${previewParts.join(" — ")} (becsült büdzsé: ${formatHuf(d.budgetHint)})`
      : previewParts.join(" — ");
    const email = renderNewMessageEmail({
      recipientName: recipient.displayName,
      senderName: brand.profile.companyName,
      preview: previewLine,
      inboxUrl: `${APP_URL}/creator/messages`,
    });
    await sendMessageEmailThrottled(recipient.creatorUserId, recipient.email, email);
  }

  revalidatePath("/brand/messages");
  return { success: true };
}

// ===========================================================================
// Válasz egy meglévő beszélgetésben (mindkét irány)
// ===========================================================================

const replySchema = z.object({
  toUserId: z.string().uuid(),
  body: z.string().max(5000).optional().default(""),
  attachmentUrl: z.string().url().max(1000).optional().nullable(),
  attachmentName: z.string().max(255).optional().nullable(),
});

export async function replyToUser(input: z.input<typeof replySchema>) {
  const current = await getCurrentUser();
  if (!current?.dbUser) return { error: "Nincs bejelentkezve" };

  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  // Spam-védelem: csak akkor lehet válaszolni, ha már létezik beszélgetés.
  const existing = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, current.dbUser.id), eq(messages.toUserId, d.toUserId)),
        and(eq(messages.fromUserId, d.toUserId), eq(messages.toUserId, current.dbUser.id))
      )
    )
    .limit(1);
  if (existing.length === 0) {
    return { error: "Erre a felhasználóra még nincs beszélgetésed" };
  }

  // Címzett adatok (creator vagy brand profil)
  const recipientRows = await db
    .select({
      email: users.email,
      role: users.role,
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
    .where(eq(users.id, d.toUserId))
    .limit(1);

  const recipient = recipientRows[0];
  if (!recipient) return { error: "A címzett nem található" };

  // Feladó (nekünk)  neve a notification + email szövegéhez
  const meRows = await db
    .select({
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
    .where(eq(users.id, current.dbUser.id))
    .limit(1);
  const meName =
    meRows[0]?.creatorName ?? meRows[0]?.brandName ?? current.authUser.email ?? "Felhasználó";

  const bodyText = (d.body ?? "").trim();
  if (!bodyText && !d.attachmentUrl) {
    return { error: "Üres üzenet — írj szöveget vagy csatolj fájlt." };
  }

  await db.insert(messages).values({
    fromUserId: current.dbUser.id,
    toUserId: d.toUserId,
    body: bodyText,
    attachmentUrl: d.attachmentUrl ?? null,
    attachmentName: d.attachmentName ?? null,
  });

  const isToCreator = recipient.role === "creator";
  const link = isToCreator ? "/creator/messages" : "/brand/messages";
  const preview = bodyText
    ? bodyText.slice(0, 120)
    : `📎 ${d.attachmentName ?? "Csatolmányt küldött"}`;

  await db.insert(notifications).values({
    userId: d.toUserId,
    type: "message",
    title: `Új üzenet: ${meName}`,
    body: preview,
    link,
  });

  await sendExpoPush([d.toUserId], {
    title: meName,
    body: preview,
    data: { type: "message", partnerId: current.dbUser.id },
  });

  {
    const email = renderNewMessageEmail({
      recipientName: recipient.creatorName ?? recipient.brandName ?? "Felhasználó",
      senderName: meName,
      preview: bodyText ? bodyText.slice(0, 220) : (d.attachmentName ? `📎 ${d.attachmentName}` : undefined),
      inboxUrl: `${APP_URL}${link}`,
    });
    await sendMessageEmailThrottled(d.toUserId, recipient.email, email);
  }

  revalidatePath("/creator/messages");
  revalidatePath("/brand/messages");
  revalidatePath("/admin/inbox");
  return { success: true };
}

// ===========================================================================
// Admin → tartalomgyártó *induló* üzenet (admin közvetlenül megkereshet creatort)
// ===========================================================================

const adminMsgSchema = z.object({
  toUsername: z.string().min(1),
  body: z.string().min(1, "Az üzenet nem lehet üres").max(5000),
});

export async function adminMessageCreator(input: z.input<typeof adminMsgSchema>) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { error: "Csak admin" };

  const parsed = adminMsgSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  const [recipient] = await db
    .select({
      creatorUserId: creatorProfiles.userId,
      displayName: creatorProfiles.displayName,
      email: users.email,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.username, d.toUsername))
    .limit(1);
  if (!recipient) return { error: "A tartalomgyártó nem található" };

  await db.insert(messages).values({
    fromUserId: current.dbUser.id,
    toUserId: recipient.creatorUserId,
    body: d.body,
  });

  await db.insert(notifications).values({
    userId: recipient.creatorUserId,
    type: "message",
    title: "Új üzenet: Creatorz csapat",
    body: d.body.slice(0, 120),
    link: "/creator/messages",
  });

  await sendExpoPush([recipient.creatorUserId], {
    title: "Creatorz csapat",
    body: d.body.slice(0, 140),
    data: { type: "message", partnerId: current.dbUser.id },
  });

  const email = renderNewMessageEmail({
    recipientName: recipient.displayName,
    senderName: "Creatorz csapat",
    preview: d.body.slice(0, 220),
    inboxUrl: `${APP_URL}/creator/messages`,
  });
  await sendMessageEmailThrottled(recipient.creatorUserId, recipient.email, email);

  revalidatePath("/admin/inbox");
  revalidatePath("/creator/messages");
  return { success: true };
}

// ===========================================================================
// Admin → BÁRMELY felhasználó (márka VAGY tartalomgyártó/kreatív) — user id alapján
// ===========================================================================

const adminMsgUserSchema = z.object({
  toUserId: z.string().uuid(),
  body: z.string().min(1, "Az üzenet nem lehet üres").max(5000),
});

export async function adminMessageUser(input: z.input<typeof adminMsgUserSchema>) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") return { error: "Csak admin" };

  const parsed = adminMsgUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;
  if (d.toUserId === current.dbUser.id) return { error: "Magadnak nem küldhetsz." };

  const [recipient] = await db
    .select({
      email: users.email,
      role: users.role,
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
    })
    .from(users)
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
    .where(eq(users.id, d.toUserId))
    .limit(1);
  if (!recipient) return { error: "A címzett nem található" };

  const link = recipient.role === "brand" ? "/brand/messages" : "/creator/messages";
  const recipientName = recipient.creatorName ?? recipient.brandName ?? "Felhasználó";

  await db.insert(messages).values({
    fromUserId: current.dbUser.id,
    toUserId: d.toUserId,
    body: d.body,
  });

  await db.insert(notifications).values({
    userId: d.toUserId,
    type: "message",
    title: "Új üzenet: Creatorz csapat",
    body: d.body.slice(0, 120),
    link,
  });

  await sendExpoPush([d.toUserId], {
    title: "Creatorz csapat",
    body: d.body.slice(0, 140),
    data: { type: "message", partnerId: current.dbUser.id },
  });

  const email = renderNewMessageEmail({
    recipientName,
    senderName: "Creatorz csapat",
    preview: d.body.slice(0, 220),
    inboxUrl: `${APP_URL}${link}`,
  });
  await sendMessageEmailThrottled(d.toUserId, recipient.email, email);

  revalidatePath("/admin/inbox");
  revalidatePath(link);
  return { success: true };
}
