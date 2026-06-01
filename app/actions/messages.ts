"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { creatorProfiles, users, messages, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentBrand } from "@/lib/auth";
import { sendEmailSafe } from "@/lib/resend/client";
import { formatHuf } from "@/lib/utils/format";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const schema = z.object({
  toUsername: z.string().min(1),
  subject: z.string().max(200).optional().or(z.literal("")),
  body: z.string().min(1, "Az üzenet nem lehet üres").max(5000),
  budgetHint: z.coerce.number().int().min(0).optional().nullable(),
});

export async function sendMessage(input: z.input<typeof schema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Csak bejelentkezett márka küldhet üzenetet" };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  // Címzett creator → user feloldás
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
  if (!recipient) return { error: "A címzett creator nem található" };

  // Üzenet mentése
  await db.insert(messages).values({
    fromUserId: brand.appUserId,
    toUserId: recipient.creatorUserId,
    subject: d.subject || null,
    body: d.body,
    budgetHint: d.budgetHint ?? null,
  });

  // Értesítés a creatornak
  await db.insert(notifications).values({
    userId: recipient.creatorUserId,
    type: "message",
    title: `Új üzenet: ${brand.profile.companyName}`,
    body: d.subject || d.body.slice(0, 120),
    link: "/creator/messages",
  });

  // Email (best-effort)
  const budgetLine = d.budgetHint
    ? `<p><strong>Becsült büdzsé:</strong> ${formatHuf(d.budgetHint)}</p>`
    : "";
  await sendEmailSafe({
    to: recipient.email,
    subject: `Új üzenet a Creatorz-on – ${brand.profile.companyName}`,
    html: `
      <h2>Új üzenet érkezett</h2>
      <p><strong>${brand.profile.companyName}</strong> üzenetet küldött neked:</p>
      ${d.subject ? `<p><strong>Tárgy:</strong> ${d.subject}</p>` : ""}
      <blockquote>${d.body.replace(/\n/g, "<br/>")}</blockquote>
      ${budgetLine}
      <p><a href="${APP_URL}/creator/messages">Megnyitás a Creatorz-on</a></p>
    `,
  });

  return { success: true };
}
