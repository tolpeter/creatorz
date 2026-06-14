"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, HOUR } from "@/lib/utils/rate-limit";
import { sendEmailSafe } from "@/lib/resend/client";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

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

  // Értesítő email az adminnak (best-effort)
  if (ADMIN_EMAIL) {
    await sendEmailSafe({
      to: ADMIN_EMAIL,
      subject: `Új kapcsolati üzenet: ${d.subject}`,
      html: `
        <h2>Új üzenet a kapcsolat űrlapról</h2>
        <p><strong>Feladó:</strong> ${d.name ? `${d.name} · ` : ""}${d.email}</p>
        <p><strong>Tárgy:</strong> ${d.subject}</p>
        <p style="white-space:pre-wrap">${d.message}</p>
        <hr />
        <p style="font-size:12px;color:#888">Creatorz admin — Üzenetek menü</p>
      `,
    });
  }

  return { success: true };
}
