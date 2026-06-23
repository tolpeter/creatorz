import { redirect } from "next/navigation";
import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  savedCreators,
  creatorProfiles,
  ads,
  adInvitations,
  adApplications,
} from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";
import { InviteToAdModal } from "@/components/brand/invite-to-ad-modal";
import { type InvitableAd } from "@/app/actions/invitations";

export const metadata = { title: "Mentett tartalomgyártók" };

export default async function BrandSavedPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const rows = await db
    .select({
      id: creatorProfiles.id,
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

  // A márka aktív kampányai — egyszer kérjük le, minden creatornál ugyanazok.
  // A meghívás/pályázat állapotot batchelve számoljuk (2 lekérdezés).
  const activeAds = await db
    .select({ id: ads.id, title: ads.title })
    .from(ads)
    .where(and(eq(ads.brandId, brand.profile.id), eq(ads.status, "active")))
    .orderBy(desc(ads.createdAt));

  const invitedSet = new Set<string>();
  const appliedSet = new Set<string>();
  if (activeAds.length > 0 && rows.length > 0) {
    const adIds = activeAds.map((a) => a.id);
    const creatorIds = rows.map((r) => r.id);
    const [invitations, applications] = await Promise.all([
      db
        .select({ adId: adInvitations.adId, creatorId: adInvitations.creatorId })
        .from(adInvitations)
        .where(
          and(inArray(adInvitations.adId, adIds), inArray(adInvitations.creatorId, creatorIds)),
        ),
      db
        .select({ adId: adApplications.adId, creatorId: adApplications.creatorId })
        .from(adApplications)
        .where(
          and(inArray(adApplications.adId, adIds), inArray(adApplications.creatorId, creatorIds)),
        ),
    ]);
    invitations.forEach((r) => invitedSet.add(`${r.adId}:${r.creatorId}`));
    applications.forEach((r) => appliedSet.add(`${r.adId}:${r.creatorId}`));
  }

  const creators = rows.map((r) => {
    const card: CreatorCardData = {
      username: r.username,
      displayName: r.displayName,
      avatarUrl: r.avatarUrl,
      city: r.city,
      categories: r.categories ?? [],
      instagramFollowers: r.instagramFollowers,
      instagramVerified: r.instagramVerified,
      tiktokFollowers: r.tiktokFollowers,
      tiktokVerified: r.tiktokVerified,
      isFeatured: r.isFeatured || r.isAdminFeatured,
      averageRating: r.averageRating,
      reviewCount: r.reviewCount,
    };
    const invitableAds: InvitableAd[] = activeAds.map((a) => ({
      id: a.id,
      title: a.title,
      alreadyInvited: invitedSet.has(`${a.id}:${r.id}`),
      alreadyApplied: appliedSet.has(`${a.id}:${r.id}`),
    }));
    return { creatorId: r.id, card, invitableAds };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mentett tartalomgyártók</h1>
        <p className="text-muted-foreground">{creators.length} mentett tartalomgyártó</p>
      </div>
      {creators.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs mentett tartalomgyártó. A tartalomgyártó profilján a „Mentés" gombbal
          adhatsz hozzá.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <div key={c.card.username} className="flex flex-col gap-2">
              <CreatorCard creator={c.card} />
              <InviteToAdModal
                creatorId={c.creatorId}
                creatorName={c.card.displayName}
                ads={c.invitableAds}
                triggerClassName="w-full border-black/15 bg-white text-foreground hover:bg-accent hover:text-black"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
