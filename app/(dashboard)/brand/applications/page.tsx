import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import { db } from "@/lib/db";
import { ads, adApplications, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ApplicationStatusBadge } from "@/components/shared/ad-status-badge";
import { ApplicationActions } from "@/components/brand/application-actions";
import { formatHuDate } from "@/lib/utils/format";

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

      {apps.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs jelentkező egyik hirdetésedre sem. Oszd meg a hirdetéseidet,
          vagy hívj meg tartalomgyártókat a profiljukról.
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <Card key={a.id}>
              <CardContent className="space-y-3 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link
                    href={`/creators/${a.username}`}
                    target="_blank"
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={a.avatarUrl ?? undefined} />
                      <AvatarFallback>
                        {a.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{a.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatHuDate(a.createdAt)}
                      </p>
                    </div>
                  </Link>
                  <ApplicationStatusBadge status={a.status} />
                </div>

                <Link
                  href={`/brand/ads/${a.adId}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f4e5] px-3 py-1 text-xs font-semibold text-[#3f6212] hover:bg-[#e6efd4]"
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  {a.adTitle}
                </Link>

                <p className="whitespace-pre-wrap text-sm">{a.message}</p>

                {a.status === "pending" && <ApplicationActions applicationId={a.id} />}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
