import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, adApplications, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { ApplicantsList } from "@/components/brand/applicants-list";

export const metadata = { title: "Jelentkezők" };

export default async function BrandApplicationsPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const apps = await db
    .select({
      id: adApplications.id,
      message: adApplications.message,
      status: adApplications.status,
      createdAt: adApplications.createdAt,
      adId: ads.id,
      adTitle: ads.title,
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      tiktokLikes: creatorProfiles.tiktokLikes,
      instagramFollowers: creatorProfiles.instagramFollowers,
      facebookFollowers: creatorProfiles.facebookFollowers,
      age: creatorProfiles.age,
      gender: creatorProfiles.gender,
      city: creatorProfiles.city,
      county: creatorProfiles.county,
      creatorType: creatorProfiles.creatorType,
      categories: creatorProfiles.categories,
    })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .where(eq(ads.brandId, brand.profile.id))
    .orderBy(desc(adApplications.createdAt));

  const pendingCount = apps.filter((a) => a.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jelentkezők</h1>
        <p className="text-muted-foreground">
          {apps.length} jelentkezés összesen
          {pendingCount > 0 ? ` · ${pendingCount} elbírálásra vár` : ""}
        </p>
      </div>

      <ApplicantsList apps={apps} />
    </div>
  );
}
