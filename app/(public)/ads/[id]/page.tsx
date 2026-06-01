import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { CalendarDays, Wallet, MapPin, Film, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { ads, brandProfiles, adApplications } from "@/lib/db/schema";
import { getCurrentUser, getCurrentCreator } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplyModal } from "@/components/creator/apply-modal";
import { CREATOR_CATEGORIES, CONTENT_TYPES, USAGE_RIGHTS } from "@/lib/constants";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export default async function AdDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const rows = await db
    .select({
      ad: ads,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
      brandWebsite: brandProfiles.websiteUrl,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, id))
    .limit(1);

  const row = rows[0];
  if (!row || row.ad.status !== "active") notFound();
  const ad = row.ad;

  const current = await getCurrentUser();
  const creator = await getCurrentCreator();

  let alreadyApplied = false;
  if (creator) {
    const a = await db
      .select({ id: adApplications.id })
      .from(adApplications)
      .where(and(eq(adApplications.adId, id), eq(adApplications.creatorId, creator.profile.id)))
      .limit(1);
    alreadyApplied = a.length > 0;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/ads">← Vissza a hirdetésekhez</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            {row.brandLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.brandLogo} alt="" className="h-9 w-9 rounded object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded bg-muted text-sm font-semibold">
                {row.brandName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-sm text-muted-foreground">{row.brandName}</span>
          </div>
          <CardTitle className="text-2xl">{ad.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {ad.categories.map((c) => (
              <Badge key={c} variant="secondary">
                {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
              </Badge>
            ))}
          </div>

          <p className="whitespace-pre-wrap text-sm">{ad.description}</p>

          <div className="grid gap-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              {formatHuf(ad.budgetMinHuf)} – {formatHuf(ad.budgetMaxHuf)}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              Határidő: {formatHuDate(ad.deadline)}
            </p>
            <p className="flex items-center gap-2">
              <Film className="h-4 w-4 text-muted-foreground" />
              {ad.itemCount} db ·{" "}
              {CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label}
            </p>
            <p className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              {USAGE_RIGHTS.find((x) => x.value === ad.usageRights)?.label}
            </p>
            {ad.location && (
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> {ad.location}
              </p>
            )}
          </div>

          {ad.referenceLinks.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">Referencia linkek:</p>
              <ul className="list-inside list-disc">
                {ad.referenceLinks.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2">
            {creator ? (
              alreadyApplied ? (
                <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">
                  Erre a hirdetésre már pályáztál
                </Badge>
              ) : (
                <ApplyModal adId={ad.id} adTitle={ad.title} />
              )
            ) : current?.dbUser?.role === "brand" ? (
              <p className="text-sm text-muted-foreground">
                Márkaként nem tudsz pályázni saját/más hirdetésére.
              </p>
            ) : (
              <Button asChild size="lg">
                <Link href="/login">Jelentkezz be creatorként a pályázáshoz</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
