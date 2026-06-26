import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles, adApplications, adInvitations, creatorProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import {
  CREATOR_CATEGORIES,
  CONTENT_TYPES,
  COLLABORATION_TYPES,
  USAGE_RIGHTS,
} from "@/lib/constants";
import { formatHuf } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const TARGET_LABELS: Record<string, string> = {
  ugc: "UGC tartalomgyártó",
  influencer: "Influenszer",
  model: "Modell",
  editor: "Videóvágó",
  photographer: "Fotós",
  videographer: "Operatőr",
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db
    .select({ ad: ads, brandName: brandProfiles.companyName })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(UUID_RE.test(id) ? eq(ads.id, id) : eq(ads.slug, id))
    .limit(1);
  if (!row || row.ad.status !== "active") {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  const ad = row.ad;

  // Opcionális auth: ha bejelentkezett creator nézi, jelezzük a pályázat/meghívás állapotot.
  let alreadyApplied = false;
  let invited = false;
  const user = await getMobileUser(req);
  if (user?.role === "creator") {
    const [creator] = await db
      .select({ id: creatorProfiles.id })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    if (creator) {
      const [a, inv] = await Promise.all([
        db.select({ id: adApplications.id }).from(adApplications)
          .where(and(eq(adApplications.adId, ad.id), eq(adApplications.creatorId, creator.id))).limit(1),
        db.select({ id: adInvitations.id }).from(adInvitations)
          .where(and(eq(adInvitations.adId, ad.id), eq(adInvitations.creatorId, creator.id), eq(adInvitations.status, "pending"))).limit(1),
      ]);
      alreadyApplied = a.length > 0;
      invited = inv.length > 0;
    }
  }

  const showBudget = ad.budgetPublic && (ad.budgetMinHuf != null || ad.budgetMaxHuf != null);
  const budgetLabel = showBudget
    ? ad.budgetMinHuf != null && ad.budgetMaxHuf != null
      ? `${formatHuf(ad.budgetMinHuf)} - ${formatHuf(ad.budgetMaxHuf)}`
      : formatHuf((ad.budgetMaxHuf ?? ad.budgetMinHuf) as number)
    : "Megegyezés szerint";

  return Response.json({
    id: ad.id,
    title: ad.title,
    description: ad.description,
    brandName: ad.anonymous ? "Bizalmas márka" : row.brandName,
    coverUrl: ad.coverUrl,
    categoryLabels: (ad.categories ?? []).map((c) => CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c),
    targetKindLabels: (ad.targetKinds ?? ["ugc"]).map((k) => TARGET_LABELS[k] ?? k),
    contentTypeLabel: CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label ?? ad.contentType,
    collabLabel: COLLABORATION_TYPES.find((x) => x.value === ad.collaborationType)?.label ?? ad.collaborationType,
    usageRightsLabel: USAGE_RIGHTS.find((x) => x.value === ad.usageRights)?.label ?? ad.usageRights,
    budgetLabel,
    deadline: ad.deadline,
    location: ad.location,
    referenceLinks: ad.referenceLinks ?? [],
    alreadyApplied,
    invited,
  });
}
