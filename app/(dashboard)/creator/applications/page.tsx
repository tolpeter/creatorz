import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { adApplications, ads, brandProfiles } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ApplicationStatusBadge } from "@/components/shared/ad-status-badge";
import { WithdrawApplicationButton } from "@/components/creator/withdraw-application-button";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Pályázataim" };

export default async function CreatorApplicationsPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const rows = await db
    .select({
      id: adApplications.id,
      message: adApplications.message,
      proposedPriceHuf: adApplications.proposedPriceHuf,
      status: adApplications.status,
      createdAt: adApplications.createdAt,
      adId: ads.id,
      adTitle: ads.title,
      brandName: brandProfiles.companyName,
    })
    .from(adApplications)
    .innerJoin(ads, eq(ads.id, adApplications.adId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(adApplications.creatorId, creator.profile.id))
    .orderBy(desc(adApplications.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pályázataim</h1>
        <p className="text-muted-foreground">{rows.length} pályázat</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nem pályáztál. Nézd meg az elérhető{" "}
          <Link href="/ads" className="text-accent underline">
            kampányokat
          </Link>
          !
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/ads/${r.adId}`} className="font-medium hover:underline">
                    {r.adTitle}
                  </Link>
                  <p className="text-sm text-muted-foreground">{r.brandName}</p>
                </div>
                <ApplicationStatusBadge status={r.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{r.message}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm">
                  {r.proposedPriceHuf != null && (
                    <>
                      Ár-ajánlat: <strong>{formatHuf(r.proposedPriceHuf)}</strong> ·{" "}
                    </>
                  )}
                  {formatHuDate(r.createdAt)}
                </span>
                {r.status === "pending" && <WithdrawApplicationButton applicationId={r.id} />}
                {r.status === "accepted" && (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/creator/messages">Üzenet a márkának</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
