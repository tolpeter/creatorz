import "server-only";
import { and, desc, eq, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { adApplications, ads, creatorProfiles } from "@/lib/db/schema";
import { adEmbeddingText, cosineSim, creatorEmbeddingText, embedText } from "@/lib/ai/embeddings";

export type RecommendedCreator = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  city: string | null;
  categories: string[];
  tiktokFollowers: number | null;
  instagramFollowers: number | null;
  verified: boolean;
  isFeatured: boolean;
  averageRating: string | null;
  reviewCount: number;
  /** 0..100 illeszkedési pontszám (UI-hoz). */
  matchScore: number;
};

/**
 * Egy creator embedding-vektorának (újra)számolása és mentése. Best-effort:
 * mentéskor hívjuk (bio/kategória/profil változás után), hogy a matching friss
 * legyen. Hiba/üres esetén csendben kihagyja.
 */
export async function refreshCreatorEmbedding(creatorId: string): Promise<void> {
  try {
    const [c] = await db.select().from(creatorProfiles).where(eq(creatorProfiles.id, creatorId)).limit(1);
    if (!c) return;
    const vec = await embedText(
      creatorEmbeddingText({
        displayName: c.displayName,
        bio: c.bio,
        categories: c.categories,
        city: c.city,
        county: c.county,
        languages: c.languages,
        profileKind: c.profileKind,
        professionalRoles: c.professionalRoles,
        specialties: c.specialties,
      }),
    );
    if (vec) {
      await db
        .update(creatorProfiles)
        .set({ embedding: vec, embeddingUpdatedAt: new Date() })
        .where(eq(creatorProfiles.id, creatorId));
    }
  } catch {
    /* best-effort */
  }
}

const MAX_CANDIDATES = 80; // ennyi jelöltet pontozunk
const MAX_EMBED_PER_CALL = 50; // ennyi hiányzó embeddinget pótolunk egy híváskor

/**
 * AI-ajánlott tartalomgyártók egy hirdetéshez: a hirdetés és a creator-profilok
 * embedding-vektorainak koszinusz-hasonlósága + kategória-átfedés bónusz.
 * A már jelentkezett creatorokat kihagyja. Best-effort: ha nincs OpenAI kulcs
 * vagy embedding, üres listát ad (a hívó elrejti a blokkot).
 */
export async function getRecommendedCreators(
  adId: string,
  limit = 6,
): Promise<RecommendedCreator[]> {
 try {
  const [ad] = await db.select().from(ads).where(eq(ads.id, adId)).limit(1);
  if (!ad) return [];

  const adVec = await embedText(
    adEmbeddingText({
      title: ad.title,
      description: ad.description,
      categories: ad.categories,
      collaborationType: ad.collaborationType,
      location: ad.location,
    }),
  );
  if (!adVec) return [];

  // Akik már jelentkeztek erre a hirdetésre — őket kihagyjuk.
  const applied = await db
    .select({ creatorId: adApplications.creatorId })
    .from(adApplications)
    .where(eq(adApplications.adId, adId));
  const appliedIds = applied.map((a) => a.creatorId);

  // Jelöltek: lehetőleg kategória-átfedéssel; ha nincs, bármelyik.
  const cats = ad.categories ?? [];
  const baseWhere = appliedIds.length ? notInArray(creatorProfiles.id, appliedIds) : undefined;
  const catWhere =
    cats.length > 0
      ? sql`${creatorProfiles.categories} ?| ${sql.raw(`array[${cats.map((c) => `'${c.replace(/'/g, "''")}'`).join(",")}]`)}`
      : undefined;

  const conditions = [catWhere, baseWhere].filter(Boolean) as ReturnType<typeof eq>[];
  let candidates = await db
    .select()
    .from(creatorProfiles)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(creatorProfiles.isFeatured), desc(creatorProfiles.tiktokFollowers))
    .limit(MAX_CANDIDATES);

  // Ha kategória-szűréssel kevés jött, egészítsük ki kategória nélkül.
  if (candidates.length < limit && cats.length > 0) {
    const extra = await db
      .select()
      .from(creatorProfiles)
      .where(baseWhere ?? ne(creatorProfiles.id, "00000000-0000-0000-0000-000000000000"))
      .orderBy(desc(creatorProfiles.isFeatured), desc(creatorProfiles.tiktokFollowers))
      .limit(MAX_CANDIDATES);
    const seen = new Set(candidates.map((c) => c.id));
    for (const e of extra) if (!seen.has(e.id)) candidates.push(e);
    candidates = candidates.slice(0, MAX_CANDIDATES);
  }

  // Hiányzó embeddingek lazy pótlása (korlátozott darabszám / hívás).
  const missing = candidates.filter((c) => !Array.isArray(c.embedding) || c.embedding.length === 0).slice(0, MAX_EMBED_PER_CALL);
  if (missing.length > 0) {
    const now = new Date();
    await Promise.all(
      missing.map(async (c) => {
        const vec = await embedText(
          creatorEmbeddingText({
            displayName: c.displayName,
            bio: c.bio,
            categories: c.categories,
            city: c.city,
            county: c.county,
            languages: c.languages,
            profileKind: c.profileKind,
            professionalRoles: c.professionalRoles,
            specialties: c.specialties,
          }),
        );
        if (vec) {
          c.embedding = vec; // a memóriabeli sorba is, hogy most rangsorolható legyen
          await db
            .update(creatorProfiles)
            .set({ embedding: vec, embeddingUpdatedAt: now })
            .where(eq(creatorProfiles.id, c.id))
            .catch(() => {});
        }
      }),
    );
  }

  const scored = candidates
    .filter((c) => Array.isArray(c.embedding) && c.embedding.length > 0)
    .map((c) => {
      const sim = cosineSim(adVec, c.embedding as number[]); // jellemzően ~0.2..0.6
      const overlap = (c.categories ?? []).some((x) => cats.includes(x)) ? 0.06 : 0;
      const ratingBoost = c.averageRating ? Math.min(0.04, (Number(c.averageRating) / 5) * 0.04) : 0;
      const raw = sim + overlap + ratingBoost;
      // 0.15..0.65 nyers tartományt 5..99%-ra skálázzuk a UI-nak.
      const pct = Math.max(5, Math.min(99, Math.round(((raw - 0.15) / 0.5) * 100)));
      return { c, raw, pct };
    })
    .sort((a, b) => b.raw - a.raw)
    .slice(0, limit);

  return scored.map(({ c, pct }) => ({
    id: c.id,
    username: c.username,
    displayName: c.displayName,
    avatarUrl: c.avatarUrl,
    city: c.city,
    categories: c.categories ?? [],
    tiktokFollowers: c.tiktokFollowers,
    instagramFollowers: c.instagramFollowers,
    verified: c.verified,
    isFeatured: c.isFeatured || c.isAdminFeatured,
    averageRating: c.averageRating,
    reviewCount: c.reviewCount,
    matchScore: pct,
  }));
 } catch (err) {
    // Pl. ha a migráció (embedding oszlop) még nem futott le, vagy nincs OpenAI
    // kulcs — ilyenkor csak elrejtjük a blokkot, nem hibázik a hirdetés-oldal.
    console.error("[ai] getRecommendedCreators failed:", (err as Error).message);
    return [];
 }
}
