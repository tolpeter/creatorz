import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ads,
  adInvitations,
  adApplications,
  brandProfiles,
  creatorProfiles,
  notifications,
  users,
} from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { sendEmailSafe } from "@/lib/resend/client";
import { sendExpoPush } from "@/lib/push";
import { renderAdInvitationEmail } from "@/lib/email/templates";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
const schema = z.object({ adId: z.string().uuid(), message: z.string().max(1000).optional() });

/** Márka meghív egy tartalomgyártót a saját, aktív hirdetésére. */
export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "brand") return Response.json({ error: "Csak márka hívhat meg" }, { status: 403 });
  const { username } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Érvénytelen adatok" }, { status: 400 });
  const { adId, message } = parsed.data;

  const [brand] = await db
    .select({ id: brandProfiles.id, companyName: brandProfiles.companyName })
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);
  const [creator] = await db
    .select({ id: creatorProfiles.id, userId: creatorProfiles.userId, displayName: creatorProfiles.displayName, email: users.email })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  if (!brand || !creator) return Response.json({ error: "not found" }, { status: 404 });

  const [ad] = await db
    .select({ id: ads.id, title: ads.title, status: ads.status, brandId: ads.brandId })
    .from(ads)
    .where(eq(ads.id, adId))
    .limit(1);
  if (!ad || ad.brandId !== brand.id) return Response.json({ error: "A hirdetés nem található" }, { status: 404 });
  if (ad.status !== "active") return Response.json({ error: "Csak aktív hirdetésre lehet meghívni" }, { status: 400 });

  const applied = await db
    .select({ id: adApplications.id })
    .from(adApplications)
    .where(and(eq(adApplications.adId, adId), eq(adApplications.creatorId, creator.id)))
    .limit(1);
  if (applied.length > 0) return Response.json({ error: "Ez a creator már pályázott erre." }, { status: 409 });

  const inserted = await db
    .insert(adInvitations)
    .values({ adId, brandId: brand.id, creatorId: creator.id, message: message || null })
    .onConflictDoNothing({ target: [adInvitations.adId, adInvitations.creatorId] })
    .returning({ id: adInvitations.id });
  if (!inserted[0]) return Response.json({ error: "Ezt a creatort már meghívtad erre a hirdetésre." }, { status: 409 });

  await db.insert(notifications).values({
    userId: creator.userId,
    type: "ad_invitation",
    title: `Meghívás egy hirdetésre: ${brand.companyName}`,
    body: `„${ad.title}" — a márka kifejezetten téged hívott meg.`,
    link: `/ads/${adId}`,
  });

  const email = renderAdInvitationEmail({
    creatorName: creator.displayName,
    brandName: brand.companyName,
    adTitle: ad.title,
    adUrl: `${APP_URL}/ads/${adId}`,
    message: message || undefined,
  });
  await sendEmailSafe({ to: creator.email, ...email });
  await sendExpoPush([creator.userId], {
    title: `Meghívás: ${brand.companyName}`,
    body: `„${ad.title}" — pályázz, hogy ne maradj le!`,
    data: { type: "ad_invitation" },
  });

  return Response.json({ success: true });
}
