import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, adApplications, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AdStatusBadge,
  ApplicationStatusBadge,
} from "@/components/shared/ad-status-badge";
import { ApplicationActions } from "@/components/brand/application-actions";
import { formatHuf, formatHuDate } from "@/lib/utils/format";
import { CREATOR_CATEGORIES } from "@/lib/constants";

export default async function BrandAdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const adRows = await db
    .select()
    .from(ads)
    .where(and(eq(ads.id, id), eq(ads.brandId, brand.profile.id)))
    .limit(1);
  const ad = adRows[0];
  if (!ad) notFound();

  const apps = await db
    .select({
      id: adApplications.id,
      message: adApplications.message,
      proposedPriceHuf: adApplications.proposedPriceHuf,
      status: adApplications.status,
      createdAt: adApplications.createdAt,
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
    })
    .from(adApplications)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .where(eq(adApplications.adId, id))
    .orderBy(desc(adApplications.createdAt));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/brand/ads">← Vissza a hirdetésekhez</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="text-2xl">{ad.title}</CardTitle>
            <AdStatusBadge status={ad.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="whitespace-pre-wrap">{ad.description}</p>
          <div className="flex flex-wrap gap-1.5">
            {ad.categories.map((c) => (
              <Badge key={c} variant="secondary">
                {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
              </Badge>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <p>💰 {formatHuf(ad.budgetMinHuf)} – {formatHuf(ad.budgetMaxHuf)}</p>
            <p>📅 Határidő: {formatHuDate(ad.deadline)}</p>
            <p>🎬 {ad.itemCount} db tartalom</p>
            {ad.location && <p>📍 {ad.location}</p>}
          </div>
          {ad.status === "rejected" && ad.rejectionReason && (
            <p className="text-destructive">Elutasítás indoka: {ad.rejectionReason}</p>
          )}
          {ad.status === "pending" && (
            <p className="text-muted-foreground">
              A hirdetés moderálásra vár. Jóváhagyás után jelenik meg a publikus
              feedben.
            </p>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-xl font-bold">Beérkezett pályázatok ({apps.length})</h2>
        {apps.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            Még nincs pályázat erre a hirdetésre.
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/creators/${a.username}`}
                      target="_blank"
                      className="flex items-center gap-3 hover:underline"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={a.avatarUrl ?? undefined} />
                        <AvatarFallback>{a.displayName.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{a.displayName}</p>
                        <p className="text-xs text-muted-foreground">{formatHuDate(a.createdAt)}</p>
                      </div>
                    </Link>
                    <ApplicationStatusBadge status={a.status} />
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{a.message}</p>
                  <p className="text-sm font-semibold">
                    Ár-ajánlat: {formatHuf(a.proposedPriceHuf)}
                  </p>
                  {a.status === "pending" && <ApplicationActions applicationId={a.id} />}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
