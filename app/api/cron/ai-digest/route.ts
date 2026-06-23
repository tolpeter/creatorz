import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ads,
  adApplications,
  adViews,
  brandProfiles,
  creatorProfiles,
  profileViews,
  users,
} from "@/lib/db/schema";
import { sendEmailSafe } from "@/lib/resend/client";
import { renderNewsletterEmail } from "@/lib/email/templates";
import { creatorWeeklyTip, brandWeeklyTip } from "@/lib/ai/digest-tips";

export const maxDuration = 300;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
const MAX_PER_RUN = 250; // biztonsági korlát a cron időkeretéhez

/**
 * Heti AI-digest e-mail: személyre szabott statisztika + AI-tipp.
 *  - Tartalomgyártó: heti profil-megtekintés, profil-kitöltöttség, tipp.
 *  - Márka: aktív kampányok, heti új pályázók + megtekintések, tipp.
 * Vercel cron hívja hetente. Best-effort: a tipp hiánya nem állítja meg a levelet.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let creatorSent = 0;
  let brandSent = 0;
  const errors: string[] = [];

  // ===== Tartalomgyártók =====
  const creators = await db
    .select({
      id: creatorProfiles.id,
      email: users.email,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      bio: creatorProfiles.bio,
      categories: creatorProfiles.categories,
      introVideoUrl: creatorProfiles.introVideoUrl,
      instagramUrl: creatorProfiles.instagramUrl,
      tiktokUrl: creatorProfiles.tiktokUrl,
      facebookUrl: creatorProfiles.facebookUrl,
      youtubeUrl: creatorProfiles.youtubeUrl,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(and(eq(users.suspended, false), eq(users.emailVerified, true)));

  // Heti profil-megtekintések creatoronként.
  const viewRows = await db
    .select({
      creatorId: profileViews.creatorId,
      n: sql<number>`count(*)::int`,
    })
    .from(profileViews)
    .where(gte(profileViews.createdAt, weekAgo))
    .groupBy(profileViews.creatorId);
  const viewsByCreator = new Map(viewRows.map((r) => [r.creatorId, r.n]));

  let processed = 0;
  for (const c of creators) {
    if (processed >= MAX_PER_RUN) break;
    const weeklyViews = viewsByCreator.get(c.id) ?? 0;

    const items = [
      { label: "Profilkép", done: Boolean(c.avatarUrl) },
      { label: "Bemutatkozás", done: Boolean(c.bio && c.bio.trim().length >= 30) },
      { label: "Kategóriák", done: (c.categories?.length ?? 0) > 0 },
      {
        label: "Közösségi profil",
        done: Boolean(c.instagramUrl || c.tiktokUrl || c.facebookUrl || c.youtubeUrl),
      },
      { label: "Bemutatkozó videó", done: Boolean(c.introVideoUrl) },
    ];
    const done = items.filter((i) => i.done).length;
    const percent = Math.round((done / items.length) * 100);
    const missing = items.filter((i) => !i.done).map((i) => i.label);

    // Csak akkor küldünk, ha van miről írni: volt megtekintés VAGY hiányos a profil.
    if (weeklyViews === 0 && percent >= 100) continue;
    processed++;

    const tip = await creatorWeeklyTip({
      displayName: c.displayName,
      weeklyViews,
      completionPercent: percent,
      missing,
    });

    const bodyHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 16px;background:#0b0d0a;border-radius:14px;color:#fff;">
            <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a3e635;font-weight:700;">Profil-megtekintés a héten</div>
            <div style="font-size:30px;font-weight:800;color:#a3e635;line-height:1.1;margin-top:2px;">${weeklyViews}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:2px;">Profil-kitöltöttség: ${percent}%</div>
          </td>
        </tr>
        ${
          tip
            ? `<tr><td style="padding:14px 16px;margin-top:10px;background:#f6f7f2;border:1px solid #e6ebd6;border-radius:14px;">
                 <div style="font-size:12px;font-weight:700;color:#4d7c0f;text-transform:uppercase;letter-spacing:.06em;">💡 Heti tipp</div>
                 <div style="font-size:14px;color:#1a1a1a;margin-top:4px;line-height:1.5;">${escapeHtml(tip)}</div>
               </td></tr>`
            : ""
        }
      </table>`;

    const rendered = renderNewsletterEmail({
      subject: `Heti összefoglalód — ${weeklyViews} profil-megtekintés`,
      preheader: tip ? tip.slice(0, 90) : `${weeklyViews} megtekintés a héten`,
      heading: `Szia ${escapeHtml(c.displayName)}!`,
      intro: "Íme a heti összefoglalód a Creatorzon, és egy személyre szabott tipp:",
      bodyHtml,
      cta: { label: "Profilom megnyitása", href: `${APP_URL}/creator/profile` },
    });

    const res = await sendEmailSafe({ to: c.email, ...rendered });
    if (res.sent) creatorSent++;
    else if (res.error) errors.push(`creator ${c.email}: ${res.error}`);
  }

  // ===== Márkák =====
  const brands = await db
    .select({
      id: brandProfiles.id,
      email: users.email,
      companyName: brandProfiles.companyName,
    })
    .from(brandProfiles)
    .innerJoin(users, eq(users.id, brandProfiles.userId))
    .where(and(eq(users.suspended, false), eq(users.emailVerified, true)));

  // Aktív kampányok / márka.
  const activeAdRows = await db
    .select({ brandId: ads.brandId, n: sql<number>`count(*)::int` })
    .from(ads)
    .where(eq(ads.status, "active"))
    .groupBy(ads.brandId);
  const activeByBrand = new Map(activeAdRows.map((r) => [r.brandId, r.n]));

  // Heti új pályázók / márka.
  const applicantRows = await db
    .select({ brandId: ads.brandId, n: sql<number>`count(*)::int` })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .where(gte(adApplications.createdAt, weekAgo))
    .groupBy(ads.brandId);
  const applicantsByBrand = new Map(applicantRows.map((r) => [r.brandId, r.n]));

  // Heti kampány-megtekintés / márka.
  const adViewRows = await db
    .select({ brandId: ads.brandId, n: sql<number>`count(*)::int` })
    .from(adViews)
    .innerJoin(ads, eq(ads.id, adViews.adId))
    .where(gte(adViews.createdAt, weekAgo))
    .groupBy(ads.brandId);
  const adViewsByBrand = new Map(adViewRows.map((r) => [r.brandId, r.n]));

  let brandProcessed = 0;
  for (const b of brands) {
    if (brandProcessed >= MAX_PER_RUN) break;
    const activeAds = activeByBrand.get(b.id) ?? 0;
    if (activeAds === 0) continue; // csak ha van élő kampánya
    brandProcessed++;

    const newApplicants = applicantsByBrand.get(b.id) ?? 0;
    const weeklyViews = adViewsByBrand.get(b.id) ?? 0;

    const tip = await brandWeeklyTip({
      companyName: b.companyName,
      activeAds,
      newApplicants,
      weeklyViews,
    });

    const bodyHtml = `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 16px;background:#0b0d0a;border-radius:14px;color:#fff;">
            <div style="font-size:30px;font-weight:800;color:#a3e635;line-height:1.1;">${newApplicants}</div>
            <div style="font-size:13px;color:rgba(255,255,255,.6);margin-top:2px;">új pályázó a héten · ${activeAds} aktív kampány · ${weeklyViews} megtekintés</div>
          </td>
        </tr>
        ${
          tip
            ? `<tr><td style="padding:14px 16px;margin-top:10px;background:#f6f7f2;border:1px solid #e6ebd6;border-radius:14px;">
                 <div style="font-size:12px;font-weight:700;color:#4d7c0f;text-transform:uppercase;letter-spacing:.06em;">💡 Heti tipp</div>
                 <div style="font-size:14px;color:#1a1a1a;margin-top:4px;line-height:1.5;">${escapeHtml(tip)}</div>
               </td></tr>`
            : ""
        }
      </table>`;

    const rendered = renderNewsletterEmail({
      subject: `Heti összefoglaló — ${newApplicants} új pályázó`,
      preheader: tip ? tip.slice(0, 90) : `${newApplicants} új pályázó a héten`,
      heading: `Szia ${escapeHtml(b.companyName)}!`,
      intro: "Íme a kampányaid heti teljesítménye és egy tipp a jobb eredményekhez:",
      bodyHtml,
      cta: { label: "Kampányaim megnyitása", href: `${APP_URL}/brand/ads` },
    });

    const res = await sendEmailSafe({ to: b.email, ...rendered });
    if (res.sent) brandSent++;
    else if (res.error) errors.push(`brand ${b.email}: ${res.error}`);
  }

  return Response.json({ creatorSent, brandSent, errors });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
