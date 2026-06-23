import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { CREATOR_CATEGORIES, CONTENT_TYPES, COLLABORATION_TYPES } from "@/lib/constants";
import { formatHuf } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const PAGE = 20;

function catLabel(v: string) {
  return CREATOR_CATEGORIES.find((c) => c.value === v)?.label ?? v;
}

/** Publikus, aktív kampányok listája a mobil apphoz. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);
  // Több kategória (vesszővel) + visszafelé kompatibilis egyedi `category`.
  const categories = (sp.get("categories") || sp.get("category") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
  const contentType = sp.get("contentType")?.trim() || "";
  const collaborationType = sp.get("collaborationType")?.trim() || "";

  const conditions = [eq(ads.status, "active")];
  if (categories.length) {
    // Bármely megadott kategóriára illeszkedjen (OR).
    conditions.push(
      sql`${ads.categories} ?| ${sql.raw(
        `array[${categories.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")}]`,
      )}`,
    );
  }
  if (contentType === "video" || contentType === "photo" || contentType === "both") {
    conditions.push(eq(ads.contentType, contentType));
  }
  if (collaborationType === "project" || collaborationType === "longterm" || collaborationType === "barter") {
    conditions.push(eq(ads.collaborationType, collaborationType));
  }

  const rows = await db
    .select({
      id: ads.id,
      slug: ads.slug,
      title: ads.title,
      categories: ads.categories,
      contentType: ads.contentType,
      collaborationType: ads.collaborationType,
      coverUrl: ads.coverUrl,
      budgetMinHuf: ads.budgetMinHuf,
      budgetMaxHuf: ads.budgetMaxHuf,
      budgetPublic: ads.budgetPublic,
      deadline: ads.deadline,
      anonymous: ads.anonymous,
      applicationCount: ads.applicationCount,
      isFeatured: ads.isFeatured,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(and(...conditions))
    .orderBy(desc(ads.isFeatured), desc(ads.createdAt))
    .limit(PAGE + 1)
    .offset(offset);

  const hasMore = rows.length > PAGE;
  const items = rows.slice(0, PAGE).map((r) => {
    const showBudget = r.budgetPublic && (r.budgetMinHuf != null || r.budgetMaxHuf != null);
    const budgetLabel = showBudget
      ? r.budgetMinHuf != null && r.budgetMaxHuf != null
        ? `${formatHuf(r.budgetMinHuf)} - ${formatHuf(r.budgetMaxHuf)}`
        : formatHuf((r.budgetMaxHuf ?? r.budgetMinHuf) as number)
      : "Megegyezés szerint";
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      brandName: r.anonymous ? "Bizalmas márka" : r.brandName,
      coverUrl: r.coverUrl,
      categoryLabels: (r.categories ?? []).map(catLabel),
      contentTypeLabel: CONTENT_TYPES.find((c) => c.value === r.contentType)?.label ?? r.contentType,
      collabLabel: COLLABORATION_TYPES.find((c) => c.value === r.collaborationType)?.label ?? r.collaborationType,
      budgetLabel,
      deadline: r.deadline,
      applicationCount: r.applicationCount,
      isFeatured: r.isFeatured,
    };
  });

  return Response.json(
    { items, hasMore, nextOffset: offset + PAGE },
    { headers: { "Cache-Control": "public, max-age=30" } },
  );
}
