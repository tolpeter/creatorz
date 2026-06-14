import { and, eq, gte, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderNewsletterEmail } from "@/lib/email/templates";

export const maxDuration = 120;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

/**
 * Heti email-digest: minden felhasználónak, akinek van olvasatlan értesítése
 * az elmúlt 7 napból, küld egy összefoglalót. Vercel cron hívja (hetente).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      userId: notifications.userId,
      email: users.email,
      suspended: users.suspended,
      title: notifications.title,
      body: notifications.body,
      link: notifications.link,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .innerJoin(users, eq(users.id, notifications.userId))
    .where(and(eq(notifications.read, false), gte(notifications.createdAt, weekAgo)))
    .orderBy(desc(notifications.createdAt));

  // Csoportosítás felhasználónként
  const byUser = new Map<string, { email: string; items: typeof rows }>();
  for (const r of rows) {
    if (r.suspended) continue;
    if (!byUser.has(r.userId)) byUser.set(r.userId, { email: r.email, items: [] });
    byUser.get(r.userId)!.items.push(r);
  }

  let sent = 0;
  const errors: string[] = [];

  for (const { email, items } of byUser.values()) {
    const top = items.slice(0, 10);
    const bodyHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${top
          .map(
            (n) => `
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #ececec;">
                <div style="font-weight:700;color:#0a0a0a;font-size:14px;">${escapeHtml(n.title)}</div>
                ${n.body ? `<div style="color:#52525b;font-size:13px;margin-top:3px;line-height:1.5;">${escapeHtml(n.body)}</div>` : ""}
              </td>
            </tr>`,
          )
          .join("")}
      </table>`;

    const rendered = renderNewsletterEmail({
      subject: `Creatorz — ${items.length} új értesítésed van`,
      preheader: `${items.length} új értesítés vár rád`,
      heading: "Heti összefoglaló",
      intro: `${items.length} olvasatlan értesítésed van az elmúlt héten.`,
      bodyHtml,
      cta: { label: "Megnyitás az irányítópulton", href: `${APP_URL}/dashboard` },
    });

    const res = await sendEmailSafe({ to: email, ...rendered });
    if (res.sent) sent++;
    else if (res.error) errors.push(`${email}: ${res.error}`);
  }

  return Response.json({ recipients: byUser.size, sent, errors });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
