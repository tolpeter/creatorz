import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, desc, sql } from "drizzle-orm";
import { Pencil, ExternalLink, Eye } from "lucide-react";
import { db } from "@/lib/db";
import { ads, adApplications, adViews, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand, getCurrentUser } from "@/lib/auth";
import { resolveViewers } from "@/lib/viewers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdStatusBadge } from "@/components/shared/ad-status-badge";
import { ApplicantsList } from "@/components/brand/applicants-list";
import { ViewersPanel, type ViewerRow } from "@/components/shared/viewers-panel";
import { formatNumber, formatBudgetRange, formatHuDate } from "@/lib/utils/format";
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
      tiktokFollowers: creatorProfiles.tiktokFollowers,
      tiktokLikes: creatorProfiles.tiktokLikes,
      instagramFollowers: creatorProfiles.instagramFollowers,
      facebookFollowers: creatorProfiles.facebookFollowers,
    })
    .from(adApplications)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, adApplications.creatorId))
    .where(eq(adApplications.adId, id))
    .orderBy(desc(adApplications.createdAt));

  // "Kik nézték meg" — csak ha az adminisztrátor bekapcsolta ennek a fióknak.
  const me = await getCurrentUser();
  const canSeeViewers = Boolean(me?.dbUser?.canSeeViewers);
  let viewerRows: ViewerRow[] = [];
  let anonymousViews = 0;
  if (canSeeViewers) {
    const grouped = await db
      .select({
        viewerUserId: adViews.viewerUserId,
        lastAt: sql<Date>`max(${adViews.createdAt})`,
        times: sql<number>`count(*)::int`,
      })
      .from(adViews)
      .where(eq(adViews.adId, id))
      .groupBy(adViews.viewerUserId);

    anonymousViews = grouped
      .filter((g) => !g.viewerUserId)
      .reduce((sum, g) => sum + g.times, 0);
    const identified = grouped.filter(
      (g): g is typeof g & { viewerUserId: string } => Boolean(g.viewerUserId),
    );
    const identities = await resolveViewers(identified.map((g) => g.viewerUserId));
    viewerRows = identified
      .map((g) => {
        const identity = identities.get(g.viewerUserId);
        return identity
          ? { identity, lastAt: new Date(g.lastAt), times: g.times }
          : null;
      })
      .filter((v): v is ViewerRow => v !== null)
      .sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());
  }

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
          <div className="mt-3 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href={`/brand/ads/${ad.id}/edit`}>
                <Pencil className="h-4 w-4" /> Szerkesztés
              </Link>
            </Button>
            {ad.status === "active" && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/ads/${ad.slug ?? ad.id}`} target="_blank">
                  <ExternalLink className="h-4 w-4" /> Hirdetésem megtekintése
                </Link>
              </Button>
            )}
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
            <p>💰 {formatBudgetRange(ad.budgetMinHuf, ad.budgetMaxHuf)}</p>
            <p>📅 Határidő: {formatHuDate(ad.deadline)}</p>
            <p className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {formatNumber(ad.viewCount ?? 0)} megtekintés
            </p>
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

      {canSeeViewers && (
        <ViewersPanel
          viewers={viewerRows}
          anonymousCount={anonymousViews}
          emptyLabel="Még senki azonosítható nem nézte meg ezt a hirdetést."
        />
      )}

      <ApplicantsList apps={apps} />
    </div>
  );
}
