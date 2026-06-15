"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderBrandedEmail } from "@/lib/email/layout";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@creatorz.hu";

async function requireAdmin() {
  const current = await getCurrentUser();
  return current?.dbUser?.role === "admin" ? current : null;
}

/** Admin: üzenet olvasottra/olvasatlanra jelölése. */
export async function setContactRead(id: string, read: boolean) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db
    .update(contactMessages)
    .set({ read })
    .where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

/** Admin: üzenet törlése. */
export async function deleteContactMessage(id: string) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

const replySchema = z.object({
  id: z.string().uuid(),
  body: z.string().trim().min(2, "A válasz túl rövid").max(6000),
});

/**
 * Admin: közvetlen válasz egy kapcsolati üzenetre. A választ branded
 * emailben küldjük a feladó címére, és megjelöljük az üzenetet
 * megválaszoltként.
 */
export async function replyToContactMessage(input: z.input<typeof replySchema>) {
  if (!(await requireAdmin())) return { error: "Csak admin" };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const { id, body } = parsed.data;

  const [msg] = await db
    .select()
    .from(contactMessages)
    .where(eq(contactMessages.id, id))
    .limit(1);
  if (!msg) return { error: "Az üzenet nem található" };

  const html = renderBrandedEmail({
    preheader: `Válasz a Creatorz csapatától — ${msg.subject}`,
    heading: "Válasz az üzenetedre",
    greeting: msg.name ? `Szia ${msg.name}!` : "Szia!",
    intro:
      "Köszönjük, hogy felvetted velünk a kapcsolatot. Az alábbiakban olvashatod a válaszunkat:",
    bodyHtml: `
      <div style="white-space:pre-wrap;border-left:3px solid #84cc16;padding:4px 0 4px 16px;margin:0 0 20px;color:#0a0a0a;">${escapeHtml(
        body,
      )}</div>
      <div style="border-top:1px solid #e4e4e7;margin-top:20px;padding-top:16px;font-size:13px;color:#71717a;">
        <strong>Az eredeti üzeneted:</strong><br/>
        <em>${escapeHtml(msg.subject)}</em><br/>
        <span style="white-space:pre-wrap;">${escapeHtml(msg.message)}</span>
      </div>
    `,
    footnote: "Erre az emailre közvetlenül válaszolhatsz.",
  });

  const res = await sendEmailSafe({
    to: msg.email,
    subject: `Re: ${msg.subject}`,
    html,
    replyTo: ADMIN_EMAIL,
  });
  if (!res.sent) {
    return { error: res.error ?? "Nem sikerült elküldeni a választ" };
  }

  await db
    .update(contactMessages)
    .set({ replied: true, replyBody: body, repliedAt: new Date(), read: true })
    .where(eq(contactMessages.id, id));

  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { success: true };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const schema = z.object({
  name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Adj meg egy érvényes email címet").max(200),
  subject: z.string().min(2).max(160),
  message: z.string().min(10, "Az üzenet legalább 10 karakter").max(4000),
});

export async function sendContactMessage(input: z.input<typeof schema>) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  // Spam-védelem: email-enként max 5 üzenet / óra
  const rl = checkRateLimit(`contact:${d.email.toLowerCase()}`, 5, HOUR);
  if (!rl.allowed) {
    return { error: "Túl sok üzenet egy óra alatt. Próbáld később." };
  }

  await db.insert(contactMessages).values({
    name: d.name || null,
    email: d.email,
    subject: d.subject,
    message: d.message,
  });

  // Értesítő email az adminnak (best-effort). A reply-to a feladó címe, így
  // az info@creatorz.hu postaládából közvetlenül lehet válaszolni neki.
  if (ADMIN_EMAIL) {
    const html = renderBrandedEmail({
      preheader: `Új kapcsolati üzenet: ${d.subject}`,
      heading: "Új kapcsolati üzenet",
      intro: "Új üzenet érkezett a Creatorz kapcsolati űrlapról:",
      bodyHtml: `
        <p style="margin:0 0 8px;"><strong>Feladó:</strong> ${d.name ? `${escapeHtml(d.name)} · ` : ""}${escapeHtml(d.email)}</p>
        <p style="margin:0 0 8px;"><strong>Tárgy:</strong> ${escapeHtml(d.subject)}</p>
        <div style="white-space:pre-wrap;border-left:3px solid #84cc16;padding:4px 0 4px 16px;margin:12px 0;color:#0a0a0a;">${escapeHtml(d.message)}</div>
      `,
      cta: {
        label: "Megnyitás az admin felületen",
        href: "https://creatorz.hu/admin/messages",
      },
      footnote: "Erre az emailre válaszolva közvetlenül a feladónak írsz.",
    });
    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: `Új kapcsolati üzenet: ${d.subject}`,
      html,
      replyTo: d.email,
    });
  }

  return { success: true };
}
