import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedCreators, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";

export const metadata = { title: "Mentett creatorok" };

export default async function BrandSavedPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const rows = await db
    .select({
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      city: creatorProfiles.city,
      categories: creatorProfiles.categories,
      instagramFollowers: creatorProfiles.instagramFollowers,
      instagramVerified: creatorProfiles.instagramVerified,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      tiktokVerified: creatorProfiles.tiktokVerified,
      isFeatured: creatorProfiles.isFeatured,
      isAdminFeatured: creatorProfiles.isAdminFeatured,
      averageRating: creatorProfiles.averageRating,
      reviewCount: creatorProfiles.reviewCount,
    })
    .from(savedCreators)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, savedCreators.creatorId))
    .where(eq(savedCreators.brandId, brand.profile.id))
    .orderBy(desc(savedCreators.createdAt));

  const creators: CreatorCardData[] = rows.map((r) => ({
    ...r,
    categories: r.categories ?? [],
    isFeatured: r.isFeatured || r.isAdminFeatured,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentett creatorok</h1>
        <p className="text-muted-foreground">{creators.length} mentett creator</p>
      </div>
      {creators.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs mentett creator. A creator profilján a „Mentés" gombbal
          adhatsz hozzá.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <CreatorCard key={c.username} creator={c} />
          ))}
        </div>
      )}
    </div>
  );
}
