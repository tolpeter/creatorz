import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ChevronRight, ExternalLink, Megaphone, FileText } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { db } from "@/lib/db";
import { ads, adApplications, brandProfiles, creatorProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { ApplicantsList } from "@/components/brand/applicants-list";

export const metadata = { title: "Admin — Jelentkezők" };

export default async function AdminApplicationsPage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({
      appId: adApplications.id,
      message: adApplications.message,
      status: adApplications.status,
      createdAt: adApplications.createdAt,
      adId: ads.id,
      adSlug: ads.slug,
      adTitle: ads.title,
      adCreatedAt: ads.createdAt,
      brandName: brandProfiles.companyName,
      anonymous: ads.anonymous,
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
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .orderBy(desc(ads.createdAt), desc(adApplications.createdAt))
    .limit(500);

  // Csoportosítás kampányonként (a sorrendet megtartva).
  const groups = new Map<
    string,
    { adTitle: string; adSlug: string | null; brandName: string; apps: typeof rows }
  >();
  for (const r of rows) {
    if (!groups.has(r.adId)) {
      groups.set(r.adId, {
        adTitle: r.adTitle,
        adSlug: r.adSlug,
        brandName: r.brandName,
        apps: [],
      });
    }
    groups.get(r.adId)!.apps.push(r);
  }
  const groupList = Array.from(groups.entries());

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Jelentkezők kampányonként"
        icon={FileText}
        description={`${rows.length} jelentkezés · ${groupList.length} kampányon`}
      />

      {groupList.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Még nincs egyetlen jelentkezés sem.
        </p>
      ) : (
        <div className="space-y-5">
          {groupList.map(([adId, g]) => (
            <details key={adId} className="group overflow-hidden rounded-2xl border bg-card">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 bg-muted/40 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  <Megaphone className="h-4 w-4 shrink-0 text-[#4d7c0f]" />
                  <span className="truncate font-bold">{g.adTitle}</span>
                  <span className="shrink-0 text-sm text-muted-foreground">· {g.brandName}</span>
                </div>
                <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-[#3f6212]">
                  {g.apps.length} jelentkező
                </span>
              </summary>

              <div className="border-t px-4 py-3">
                <Link
                  href={`/ads/${g.adSlug ?? adId}`}
                  target="_blank"
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#4d7c0f] hover:underline"
                >
                  Kampány megnyitása <ExternalLink className="h-3 w-3" />
                </Link>
                <ApplicantsList
                  apps={g.apps.map((a) => ({
                    id: a.appId,
                    message: a.message,
                    status: a.status,
                    createdAt: a.createdAt,
                    username: a.username,
                    displayName: a.displayName,
                    avatarUrl: a.avatarUrl,
                    tiktokFollowers: a.tiktokFollowers,
                    tiktokLikes: a.tiktokLikes,
                    instagramFollowers: a.instagramFollowers,
                    facebookFollowers: a.facebookFollowers,
                    age: a.age,
                    gender: a.gender,
                    city: a.city,
                    county: a.county,
                    creatorType: a.creatorType,
                    categories: a.categories,
                  }))}
                  readOnly
                  showHeading={false}
                />
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
