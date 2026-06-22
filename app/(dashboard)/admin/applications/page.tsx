import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { ExternalLink, Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { ads, adApplications, brandProfiles, creatorProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ApplicationStatusBadge } from "@/components/shared/ad-status-badge";
import { formatHuDate, formatNumber } from "@/lib/utils/format";

export const metadata = { title: "Admin — Jelentkezők" };

export default async function AdminApplicationsPage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({
      appId: adApplications.id,
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
      instagramFollowers: creatorProfiles.instagramFollowers,
    })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .orderBy(desc(ads.createdAt), desc(adApplications.createdAt))
    .limit(500);

  // Csoportosítás hirdetésenként (a sorrendet megtartva).
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
      <div>
        <h1 className="text-2xl font-bold">Jelentkezők hirdetésenként</h1>
        <p className="text-muted-foreground">
          {rows.length} jelentkezés · {groupList.length} hirdetésen
        </p>
      </div>

      {groupList.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          Még nincs egyetlen jelentkezés sem.
        </p>
      ) : (
        <div className="space-y-5">
          {groupList.map(([adId, g]) => (
            <section key={adId} className="overflow-hidden rounded-2xl border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  <Megaphone className="h-4 w-4 shrink-0 text-[#4d7c0f]" />
                  <Link
                    href={`/ads/${g.adSlug ?? adId}`}
                    target="_blank"
                    className="truncate font-bold hover:underline"
                  >
                    {g.adTitle}
                  </Link>
                  <span className="shrink-0 text-sm text-muted-foreground">· {g.brandName}</span>
                </div>
                <span className="shrink-0 rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-bold text-[#3f6212]">
                  {g.apps.length} jelentkező
                </span>
              </div>

              <div className="divide-y">
                {g.apps.map((a) => (
                  <div key={a.appId} className="flex items-center gap-3 px-4 py-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={a.avatarUrl ?? undefined} />
                      <AvatarFallback>{a.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/creators/${a.username}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 font-medium hover:underline"
                      >
                        {a.displayName}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatHuDate(a.createdAt)}
                        {a.tiktokFollowers
                          ? ` · ${formatNumber(a.tiktokFollowers)} TikTok`
                          : a.instagramFollowers
                            ? ` · ${formatNumber(a.instagramFollowers)} Instagram`
                            : ""}
                      </p>
                    </div>
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
