import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Film,
  Handshake,
  MapPin,
  ShieldCheck,
  Star,
  Wallet,
} from "lucide-react";
import { db } from "@/lib/db";
import { ads, brandProfiles, adApplications } from "@/lib/db/schema";
import { getCurrentUser, getCurrentCreator } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ApplyModal } from "@/components/creator/apply-modal";
import { ReportButton } from "@/components/shared/report-button";
import {
  CREATOR_CATEGORIES,
  CONTENT_TYPES,
  USAGE_RIGHTS,
  COLLABORATION_TYPES,
} from "@/lib/constants";
import { formatHuf, formatHuDate } from "@/lib/utils/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({
      title: ads.title,
      description: ads.description,
      coverUrl: ads.coverUrl,
      anonymous: ads.anonymous,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, id))
    .limit(1);
  if (!row) return { title: "Hirdetés" };
  const publicBrandName = row.anonymous ? "Bizalmas márka" : row.brandName;
  const desc = (row.description ?? "").slice(0, 160) || `${publicBrandName} brief a Creatorzon.`;
  return {
    title: row.title,
    description: desc,
    alternates: { canonical: `/ads/${id}` },
    openGraph: {
      type: "article",
      title: `${row.title} — ${publicBrandName}`,
      description: desc,
      url: `/ads/${id}`,
      images: row.coverUrl ? [{ url: row.coverUrl }] : undefined,
    },
  };
}

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
      brandRating: brandProfiles.averageRating,
      brandReviewCount: brandProfiles.reviewCount,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, id))
    .limit(1);

  const row = rows[0];
  if (!row || row.ad.status !== "active") notFound();
  const ad = row.ad;
  // Anonim hirdetésnél elrejtjük a márka publikus adatait — a logót, cégnevet,
  // weboldalt. A részleteket csak az érdeklődő creator látja az üzenetekben.
  const publicBrandName = ad.anonymous ? "Bizalmas márka" : row.brandName;
  const publicBrandLogo = ad.anonymous ? null : row.brandLogo;
  const publicBrandWebsite = ad.anonymous ? null : row.brandWebsite;
  const publicBrandRating = ad.anonymous ? null : row.brandRating;
  const publicBrandReviewCount = ad.anonymous ? 0 : row.brandReviewCount;

  let current: Awaited<ReturnType<typeof getCurrentUser>> = null;
  let creator: Awaited<ReturnType<typeof getCurrentCreator>> = null;
  try {
    current = await getCurrentUser();
  } catch {
    current = null;
  }
  try {
    creator = await getCurrentCreator();
  } catch {
    creator = null;
  }

  let alreadyApplied = false;
  if (creator) {
    const a = await db
      .select({ id: adApplications.id })
      .from(adApplications)
      .where(
        and(
          eq(adApplications.adId, id),
          eq(adApplications.creatorId, creator.profile.id),
        ),
      )
      .limit(1);
    alreadyApplied = a.length > 0;
  }

  const categories = ad.categories ?? [];
  const referenceLinks = ad.referenceLinks ?? [];
  const categoryLabels = categories.map(
    (c) => CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c,
  );
  const targetKindLabels = (ad.targetKinds ?? ["ugc"]).map(
    (k) =>
      ({ ugc: "UGC tartalomgyártó", editor: "Videóvágó", photographer: "Fotós", videographer: "Operatőr" })[k] ?? k,
  );
  const contentTypeLabel =
    CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label ??
    ad.contentType;
  const usageRightsLabel =
    USAGE_RIGHTS.find((x) => x.value === ad.usageRights)?.label ??
    ad.usageRights;
  const collabLabel =
    COLLABORATION_TYPES.find((x) => x.value === ad.collaborationType)?.label ??
    ad.collaborationType;
  // A költségkeret csak akkor látszik, ha a márka publikussá tette.
  const showBudget =
    ad.budgetPublic && (ad.budgetMinHuf != null || ad.budgetMaxHuf != null);
  const budgetLabel = showBudget
    ? ad.budgetMinHuf != null && ad.budgetMaxHuf != null
      ? `${formatHuf(ad.budgetMinHuf)} - ${formatHuf(ad.budgetMaxHuf)}`
      : formatHuf((ad.budgetMaxHuf ?? ad.budgetMinHuf) as number)
    : "Megegyezés szerint";
  const detailItems = [
    {
      icon: showBudget ? Wallet : Handshake,
      label: "Költségkeret",
      value: budgetLabel,
    },
    {
      icon: Handshake,
      label: "Együttműködés",
      value: collabLabel,
    },
    {
      icon: CalendarDays,
      label: "Határidő",
      value: formatHuDate(ad.deadline),
    },
    {
      icon: Film,
      label: "Tartalom",
      value: `${ad.itemCount} db · ${contentTypeLabel}`,
    },
    {
      icon: ShieldCheck,
      label: "Felhasználás",
      value: usageRightsLabel,
    },
    ...(ad.location
      ? [
          {
            icon: MapPin,
            label: "Lokáció",
            value: ad.location,
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/ads">
          <ArrowLeft className="h-3.5 w-3.5" />
          Vissza a hirdetésekhez
        </Link>
      </Button>

      <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <header className="relative isolate overflow-hidden bg-[#0b0d0a] px-5 py-7 text-white sm:px-7 lg:px-8 lg:py-8">
          {ad.coverUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(90deg,#0b0d0a_0%,rgba(11,13,10,0.92)_34%,rgba(11,13,10,0.55)_72%,rgba(11,13,10,0.3)_100%)]"
              />
            </>
          )}
          <div className="relative z-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                {publicBrandLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={publicBrandLogo}
                    alt={publicBrandName}
                    className="h-12 w-12 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-md bg-white text-base font-bold text-black">
                    {publicBrandName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white/75">
                    {publicBrandName}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-accent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {ad.anonymous ? "Bizalmas brief — kapcsolatfelvétel után láthatóvá válik" : "Aktív márka brief"}
                  </p>
                  {publicBrandReviewCount > 0 && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-white/80">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      {publicBrandRating} · {publicBrandReviewCount} értékelés
                    </p>
                  )}
                </div>
                {publicBrandWebsite && (
                  <a
                    href={publicBrandWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-white hover:text-black"
                  >
                    Weboldal <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {targetKindLabels.map((label) => (
                  <Badge
                    key={`kind-${label}`}
                    variant="outline"
                    className="rounded-md border-accent/50 bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent"
                  >
                    Keresünk: {label}
                  </Badge>
                ))}
                {categoryLabels.map((label) => (
                  <Badge
                    key={label}
                    variant="secondary"
                    className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-black hover:bg-accent"
                  >
                    {label}
                  </Badge>
                ))}
                <Badge
                  variant="outline"
                  className="rounded-md border-white/15 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white"
                >
                  {contentTypeLabel}
                </Badge>
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                {ad.title}
              </h1>
              <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-white/72 sm:text-base">
                {ad.description}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/[0.08] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                Kampány összefoglaló
              </p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-white/50">Büdzsé</p>
                  <p className="mt-1 text-2xl font-bold">{budgetLabel}</p>
                </div>
                <div className="h-px bg-white/10" />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-white/50">
                      Határidő
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatHuDate(ad.deadline)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/50">
                      Darabszám
                    </p>
                    <p className="mt-1 font-semibold">{ad.itemCount} db</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="space-y-8 px-5 py-6 sm:px-7 lg:px-8 lg:py-8">
            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Brief részletei
              </p>
              <h2 className="mt-2 text-2xl font-bold">Mit kell elkészíteni?</h2>
              <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-muted-foreground">
                {ad.description}
              </p>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Döntési pontok
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {detailItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-lg bg-[#f6f7f2] p-4"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-black shadow-sm">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span>
                        <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="mt-1 block text-sm font-bold">
                          {item.value}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {referenceLinks.length > 0 && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Referenciák
                </p>
                <div className="mt-3 space-y-2">
                  {referenceLinks.map((link) => (
                    <a
                      key={link}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-lg border border-black/10 px-4 py-3 text-sm font-medium transition-colors hover:border-accent hover:bg-[#f6f7f2]"
                    >
                      <span className="min-w-0 truncate">{link}</span>
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </section>
            )}
          </main>

          <aside className="border-t border-black/10 bg-[#f6f7f2] px-5 py-6 sm:px-7 lg:border-l lg:border-t-0 lg:px-6 lg:py-8">
            <div className="sticky top-24 space-y-5">
              <div>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-accent" />
                  Pályázási panel
                </p>
                <h2 className="mt-2 text-xl font-bold">
                  Illik rád ez a brief?
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Nézd át a büdzsét, határidőt és felhasználási jogokat, majd
                  küldj rövid, konkrét ajánlatot.
                </p>
              </div>

              <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Márka</span>
                  <span className="truncate font-semibold">
                    {publicBrandName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Formátum</span>
                  <span className="font-semibold">{contentTypeLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Felhasználás</span>
                  <span className="max-w-[160px] truncate text-right font-semibold">
                    {usageRightsLabel}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-[#0b0d0a] p-4 text-white">
                {creator ? (
                  alreadyApplied ? (
                    <Badge className="bg-accent text-black hover:bg-accent">
                      Erre a hirdetésre már pályáztál
                    </Badge>
                  ) : (
                    <div className="[&_button]:w-full [&_button]:bg-accent [&_button]:text-black [&_button]:hover:bg-white">
                      <ApplyModal adId={ad.id} adTitle={ad.title} />
                    </div>
                  )
                ) : current?.dbUser?.role === "brand" ? (
                  <p className="text-sm text-white/70">
                    Márkaként nem tudsz pályázni saját vagy más hirdetésére.
                  </p>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-accent font-semibold text-black hover:bg-white"
                  >
                    <Link href="/login">Jelentkezem</Link>
                  </Button>
                )}
              </div>
            </div>
            <div className="mt-3 text-center">
              <ReportButton
                targetType="ad"
                targetId={ad.id}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
              />
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}
