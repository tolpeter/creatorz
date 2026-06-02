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
import { sendEmailSafe } from "@/lib/resend/client";
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

  const budgetLine = d.budgetHint
    ? `<p><strong>Becsült büdzsé:</strong> ${formatHuf(d.budgetHint)}</p>`
    : "";
  await sendEmailSafe({
    to: recipient.email,
    subject: `Új üzenet a Creatorz-on – ${brand.profile.companyName}`,
    html: `
      <h2>Új üzenet érkezett</h2>
      <p>Szia ${recipient.displayName}!</p>
      <p><strong>${brand.profile.companyName}</strong> üzenetet küldött neked:</p>
      ${d.subject ? `<p><strong>Tárgy:</strong> ${d.subject}</p>` : ""}
      <blockquote>${d.body.replace(/\n/g, "<br/>")}</blockquote>
      ${budgetLine}
      <p><a href="${APP_URL}/creator/messages">Megnyitás a Creatorz-on</a></p>
      <hr />
      <p style="font-size:12px;color:#888">Creatorz – info@creatorz.hu</p>
    `,
  });

  revalidatePath("/brand/messages");
  return { success: true };
}

// ===========================================================================
// Válasz egy meglévő beszélgetésben (mindkét irány)
// ===========================================================================

const replySchema = z.object({
  toUserId: z.string().uuid(),
  body: z.string().min(1, "Az üzenet nem lehet üres").max(5000),
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

  await db.insert(messages).values({
    fromUserId: current.dbUser.id,
    toUserId: d.toUserId,
    body: d.body,
  });

  const isToCreator = recipient.role === "creator";
  const link = isToCreator ? "/creator/messages" : "/brand/messages";

  await db.insert(notifications).values({
    userId: d.toUserId,
    type: "message",
    title: `Új üzenet: ${meName}`,
    body: d.body.slice(0, 120),
    link,
  });

  await sendEmailSafe({
    to: recipient.email,
    subject: `Új üzenet a Creatorz-on – ${meName}`,
    html: `
      <h2>Új üzenet érkezett</h2>
      <p>Szia ${recipient.creatorName ?? recipient.brandName ?? ""}!</p>
      <p><strong>${meName}</strong> üzenetet küldött neked:</p>
      <blockquote>${d.body.replace(/\n/g, "<br/>")}</blockquote>
      <p><a href="${APP_URL}${link}">Megnyitás a Creatorz-on</a></p>
      <hr />
      <p style="font-size:12px;color:#888">Creatorz – info@creatorz.hu</p>
    `,
  });

  revalidatePath("/creator/messages");
  revalidatePath("/brand/messages");
  return { success: true };
}
