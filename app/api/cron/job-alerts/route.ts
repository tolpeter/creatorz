import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles, creatorProfiles, users } from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { isEmailAllowed } from "@/lib/email/prefs";
import { renderNewsletterEmail } from "@/lib/email/templates";
import { getSetting } from "@/lib/settings";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { formatHuDate } from "@/lib/utils/format";

export const maxDuration = 120;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

/**
 * Heti "új, hozzád illő kampányok" email a tartalomgyártóknak.
 * Az elmúlt 7 nap aktív kampányaiból kigyűjti a creator kategóriájához /
 * szerepköréhez illőket, és csak akkor küld levelet, ha van legalább 1 találat.
 * Vercel cron hívja (hetente).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!(await getSetting("job_alerts_enabled"))) {
    return Response.json({ skipped: "job_alerts_enabled = false" });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Elmúlt 7 nap aktív kampányai
  const recentAds = await db
    .select({
      id: ads.id,
      slug: ads.slug,
      title: ads.title,
      categories: ads.categories,
      targetKinds: ads.targetKinds,
      deadline: ads.deadline,
      anonymous: ads.anonymous,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(and(eq(ads.status, "active"), gte(ads.createdAt, weekAgo)));

  if (recentAds.length === 0) {
    return Response.json({ recipients: 0, sent: 0, note: "nincs friss kampány" });
  }

  // Jogosult creatorok (megerősített email, nem felfüggesztett)
  const creators = await db
    .select({
      userId: users.id,
      email: users.email,
      displayName: creatorProfiles.displayName,
      categories: creatorProfiles.categories,
      profileKind: creatorProfiles.profileKind,
      creatorType: creatorProfiles.creatorType,
      professionalRoles: creatorProfiles.professionalRoles,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(eq(users.suspended, false), eq(users.emailVerified, true)));

  const catLabel = (value: string) =>
    CREATOR_CATEGORIES.find((c) => c.value === value)?.label ?? value;

  let sent = 0;
  let recipients = 0;
  const errors: string[] = [];

  for (const creator of creators) {
    const creatorCats = creator.categories ?? [];
    const roles = creator.professionalRoles ?? [];

    const matched = recentAds.filter((ad) => {
      const kinds = ad.targetKinds ?? ["ugc"];
      if (creator.profileKind === "ugc") {
        // UGC / influenszer / modell: a creator típusa szerepeljen a keresett típusok közt
        const ctype = creator.creatorType ?? "ugc";
        if (!kinds.includes(ctype)) return false;
        return (ad.categories ?? []).some((c) => creatorCats.includes(c));
      }
      // kreatív szakember: a szerepköre szerepeljen a keresett típusok közt
      return roles.some((r) => kinds.includes(r));
    });

    if (matched.length === 0) continue;
    // A creator kikapcsolhatta az új-kampány emaileket.
    if (!(await isEmailAllowed(creator.userId, "campaigns"))) continue;
    recipients++;

    const top = matched.slice(0, 6);
    const bodyHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        ${top
          .map((ad) => {
            const url = `${APP_URL}/ads/${ad.slug ?? ad.id}`;
            const brand = ad.anonymous ? "Bizalmas márka" : escapeHtml(ad.brandName);
            const cats = (ad.categories ?? []).slice(0, 3).map(catLabel).join(" · ");
            return `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #ececec;">
                  <a href="${url}" style="font-weight:700;color:#0a0a0a;font-size:15px;text-decoration:none;">${escapeHtml(ad.title)}</a>
                  <div style="color:#52525b;font-size:13px;margin-top:3px;">
                    ${brand}${cats ? ` · ${cats}` : ""} · Határidő: ${formatHuDate(ad.deadline)}
                  </div>
                </td>
              </tr>`;
          })
          .join("")}
      </table>`;

    const rendered = renderNewsletterEmail({
      subject: `${matched.length} új kampány, ami illik hozzád — Creatorz`,
      preheader: `${matched.length} friss, hozzád illő márka-brief vár rád.`,
      heading: "Új kampányok neked",
      intro: `Szia ${escapeHtml(creator.displayName)}! Az elmúlt héten <strong>${matched.length}</strong> olyan kampány érkezett, ami illik a profilodhoz:`,
      bodyHtml,
      cta: { label: "Összes kampány böngészése", href: `${APP_URL}/ads` },
    });

    const res = await sendEmailSafe({ to: creator.email, ...rendered });
    if (res.sent) sent++;
    else if (res.error) errors.push(`${creator.email}: ${res.error}`);
  }

  return Response.json({ ads: recentAds.length, recipients, sent, errors });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
