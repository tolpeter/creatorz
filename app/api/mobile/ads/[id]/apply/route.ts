import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ads,
  adApplications,
  adInvitations,
  brandProfiles,
  creatorProfiles,
  portfolioItems,
  notifications,
  users,
} from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { sendEmailSafe } from "@/lib/resend/client";
import { sendExpoPush } from "@/lib/push";
import { renderNewApplicationEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({ message: z.string().min(50, "Az üzenet legalább 50 karakter").max(2000) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "creator") {
    return Response.json({ error: "Csak tartalomgyártó pályázhat." }, { status: 403 });
  }
  const { id: adId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" }, { status: 400 });
  }

  const [creator] = await db
    .select({ id: creatorProfiles.id, avatarUrl: creatorProfiles.avatarUrl, bio: creatorProfiles.bio, displayName: creatorProfiles.displayName, username: creatorProfiles.username })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.userId, user.id))
    .limit(1);
  if (!creator) return Response.json({ error: "Nincs creator profil" }, { status: 400 });

  const pf = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.id));
  const missing: string[] = [];
  if (!creator.avatarUrl) missing.push("profilkép");
  if (!creator.bio || creator.bio.trim().length === 0) missing.push("bemutatkozás");
  if ((pf[0]?.n ?? 0) < 1) missing.push("legalább 1 portfólió elem");
  if (missing.length > 0) {
    return Response.json(
      { error: `A pályázáshoz még hiányzik a profilodból: ${missing.join(", ")}. Töltsd ki a profilodnál, és próbáld újra.` },
      { status: 400 },
    );
  }

  const [ad] = await db
    .select({ id: ads.id, title: ads.title, status: ads.status, brandUserId: brandProfiles.userId, brandEmail: users.email })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .innerJoin(users, eq(users.id, brandProfiles.userId))
    .where(eq(ads.id, adId))
    .limit(1);
  if (!ad) return Response.json({ error: "A hirdetés nem található" }, { status: 404 });
  if (ad.status !== "active") return Response.json({ error: "Erre a hirdetésre nem lehet pályázni" }, { status: 400 });

  const inserted = await db
    .insert(adApplications)
    .values({ adId, creatorId: creator.id, message: parsed.data.message })
    .onConflictDoNothing({ target: [adApplications.adId, adApplications.creatorId] })
    .returning({ id: adApplications.id });
  if (!inserted[0]) return Response.json({ error: "Erre a hirdetésre már pályáztál." }, { status: 409 });

  await db.update(ads).set({ applicationCount: sql`${ads.applicationCount} + 1` }).where(eq(ads.id, adId));
  await db
    .update(adInvitations)
    .set({ status: "applied", respondedAt: new Date() })
    .where(and(eq(adInvitations.adId, adId), eq(adInvitations.creatorId, creator.id), eq(adInvitations.status, "pending")));

  await db.insert(notifications).values({
    userId: ad.brandUserId,
    type: "application",
    title: `Új pályázat: ${creator.displayName}`,
    body: `"${ad.title}" hirdetésedre érkezett egy pályázat.`,
    link: "/brand/ads",
  });

  const email = renderNewApplicationEmail({
    creatorName: creator.displayName,
    creatorUsername: creator.username,
    creatorAvatarUrl: creator.avatarUrl,
    adTitle: ad.title,
    messagePreview: parsed.data.message.slice(0, 220),
  });
  await sendEmailSafe({ to: ad.brandEmail, ...email });
  await sendExpoPush([ad.brandUserId], {
    title: "Új pályázat",
    body: `${creator.displayName} pályázott: „${ad.title}"`,
    data: { type: "application" },
  });

  return Response.json({ success: true });
}
