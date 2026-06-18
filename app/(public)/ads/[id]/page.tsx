import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ExternalLink,
  Eye,
  Film,
  Handshake,
  MapPin,
  ShieldCheck,
  Star,
} from "lucide-react";
import { db } from "@/lib/db";
import { ads, brandProfiles, adApplications, adInvitations, adViews } from "@/lib/db/schema";
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
import { formatHuf, formatHuDate, formatNumber } from "@/lib/utils/format";
import { renderMarkdownToHtml, stripMarkdown } from "@/lib/utils/markdown";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [row] = await db
    .select({
      title: ads.title,
      slug: ads.slug,
      description: ads.description,
      coverUrl: ads.coverUrl,
      anonymous: ads.anonymous,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(UUID_RE.test(id) ? eq(ads.id, id) : eq(ads.slug, id))
    .limit(1);
  if (!row) return { title: "Hirdetés" };
  const publicBrandName = row.anonymous ? "Bizalmas márka" : row.brandName;
  const desc =
    stripMarkdown(row.description ?? "").slice(0, 160) ||
    `${publicBrandName} brief a Creatorzon.`;
  const canonical = `/ads/${row.slug ?? id}`;
  return {
    title: row.title,
    description: desc,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title: `${row.title} — ${publicBrandName}`,
      description: desc,
      url: canonical,
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
      brandUserId: brandProfiles.userId,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(UUID_RE.test(id) ? eq(ads.id, id) : eq(ads.slug, id))
    .limit(1);

  const row = rows[0];
  if (!row || row.ad.status !== "active") notFound();
  const ad = row.ad;

  // Anonim hirdetésnél elrejtjük a márka publikus adatait — a logót, cégnevet,
  // weboldalt. A részleteket csak az érdeklődő creator látja az üzenetekben.
  const publicBrandName = ad.anonymous ? "Bizalmas márka" : row.brandName;
  const publicBrandLogo = ad.anonymous ? null : row.brandLogo;
  const rawWebsite = ad.anonymous ? null : row.brandWebsite;
  const publicBrandWebsite = rawWebsite
    ? /^https?:\/\//i.test(rawWebsite)
      ? rawWebsite
      : `https://${rawWebsite}`
    : null;
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

  // Megtekintés-rögzítés: MINDEN megtekintés számít (ismétlés is), kivéve a
  // hirdetés tulajdonosát. A viewer-sor a "ki nézte" funkcióhoz kell.
  const isAdOwner = current?.dbUser?.id === row.brandUserId;
  if (!isAdOwner) {
    const today = new Date().toISOString().slice(0, 10);
    void db
      .update(ads)
      .set({ viewCount: sql`${ads.viewCount} + 1` })
      .where(eq(ads.id, ad.id))
      .then(() => {}, () => {});
    void db
      .insert(adViews)
      .values({
        adId: ad.id,
        viewerUserId: current?.dbUser?.id ?? null,
        viewedDate: today,
      })
      .then(() => {}, () => {});
  }
  const viewCount = (ad.viewCount ?? 0) + (isAdOwner ? 0 : 1);

  let alreadyApplied = false;
  let invited = false;
  if (creator) {
    const [a, inv] = await Promise.all([
      db
        .select({ id: adApplications.id })
        .from(adApplications)
        .where(
          and(
            eq(adApplications.adId, ad.id),
            eq(adApplications.creatorId, creator.profile.id),
          ),
        )
        .limit(1),
      db
        .select({ id: adInvitations.id })
        .from(adInvitations)
        .where(
          and(
            eq(adInvitations.adId, ad.id),
            eq(adInvitations.creatorId, creator.profile.id),
            eq(adInvitations.status, "pending"),
          ),
        )
        .limit(1),
    ]);
    alreadyApplied = a.length > 0;
    invited = inv.length > 0;
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
    CONTENT_TYPES.find((x) => x.value === ad.contentType)?.label ?? ad.contentType;
  const usageRightsLabel =
    USAGE_RIGHTS.find((x) => x.value === ad.usageRights)?.label ?? ad.usageRights;
  const collabLabel =
    COLLABORATION_TYPES.find((x) => x.value === ad.collaborationType)?.label ??
    ad.collaborationType;
  const showBudget =
    ad.budgetPublic && (ad.budgetMinHuf != null || ad.budgetMaxHuf != null);
  const budgetLabel = showBudget
    ? ad.budgetMinHuf != null && ad.budgetMaxHuf != null
      ? `${formatHuf(ad.budgetMinHuf)} - ${formatHuf(ad.budgetMaxHuf)}`
      : formatHuf((ad.budgetMaxHuf ?? ad.budgetMinHuf) as number)
    : "Megegyezés szerint";

  // A "Döntési pontok" blokk — a bérezést/határidőt az összefoglaló mutatja,
  // így itt a többi lényeges adat szerepel.
  const detailItems = [
    { icon: Handshake, label: "Együttműködés", value: collabLabel },
    { icon: Film, label: "Tartalom", value: contentTypeLabel },
    { icon: ShieldCheck, label: "Felhasználás", value: usageRightsLabel },
    ...(ad.location ? [{ icon: MapPin, label: "Lokáció", value: ad.location }] : []),
  ];

  const descriptionHtml = renderMarkdownToHtml(ad.description);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/ads">
          <ArrowLeft className="h-3.5 w-3.5" />
          Vissza a hirdetésekhez
        </Link>
      </Button>

      <article className="overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
        <div className="relative isolate bg-[#0b0d0a] text-white">
          {ad.coverUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.coverUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Egyenletes sötét fátyol — a háttérkép a szöveg mögött is látszik,
                  de a fehér szöveg jól olvasható marad. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(rgba(11,13,10,0.74),rgba(11,13,10,0.84))]"
              />
            </>
          )}

          <div className="relative z-10 grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8">
            {/* BAL: márka + cím + (egyetlen) leírás */}
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
                    {ad.anonymous
                      ? "Bizalmas brief — kapcsolatfelvétel után láthatóvá válik"
                      : "Aktív márka brief"}
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
                    className="ml-auto inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-black shadow-lg transition-colors hover:bg-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Weboldal megtekintése
                  </a>
                )}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
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

              <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl lg:text-[2.6rem]">
                {ad.title}
              </h1>

              <div
                className="mt-4 max-w-3xl text-sm leading-7 text-white/80 sm:text-base [&_em]:italic [&_h3]:mt-5 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white [&_h4]:mt-4 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-white [&_li]:mt-1 [&_p]:mt-3 [&_strong]:font-bold [&_strong]:text-white [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>

            {/* JOBB: összefoglaló + Döntési pontok + Pályázási panel */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-5 text-foreground shadow-lg">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Kampány összefoglaló
                </p>
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground">Bérezés</p>
                  <p className="mt-1 text-2xl font-bold">{budgetLabel}</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Határidő</p>
                    <p className="mt-1 font-semibold">{formatHuDate(ad.deadline)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Megtekintés</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      {formatNumber(viewCount)}
                    </p>
                  </div>
                </div>

                {/* Döntési pontok */}
                <div className="mt-5 border-t pt-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Döntési pontok
                  </p>
                  <div className="mt-3 space-y-2">
                    {detailItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="flex items-center gap-3 rounded-lg bg-[#f6f7f2] px-3 py-2.5"
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-black shadow-sm">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                              {item.label}
                            </span>
                            <span className="mt-0.5 block text-sm font-bold">
                              {item.value}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pályázási panel */}
              <div className="rounded-2xl bg-white p-5 text-foreground shadow-lg">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5 text-[#4d7c0f]" />
                  Pályázási panel
                </p>
                <h2 className="mt-2 text-lg font-bold">Illik rád ez a brief?</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Nézd át a bérezést, határidőt és felhasználási jogokat, majd küldj
                  rövid, konkrét ajánlatot.
                </p>

                {invited && !alreadyApplied && (
                  <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-accent/50 bg-accent/10 p-3.5">
                    <Star className="mt-0.5 h-4 w-4 shrink-0 fill-accent text-accent" />
                    <p className="text-sm font-medium text-[#3f6212]">
                      <strong>{publicBrandName}</strong> kifejezetten téged hívott meg
                      erre a hirdetésre. Pályázz, hogy ne maradj le róla!
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  {creator ? (
                    alreadyApplied ? (
                      <Badge className="bg-accent text-black hover:bg-accent">
                        Erre a hirdetésre már pályáztál
                      </Badge>
                    ) : (
                      <div className="[&_button]:w-full [&_button]:bg-[#0b0d0a] [&_button]:text-white [&_button]:hover:bg-accent [&_button]:hover:text-black">
                        <ApplyModal adId={ad.id} adTitle={ad.title} />
                      </div>
                    )
                  ) : current?.dbUser?.role === "brand" ? (
                    <p className="text-sm text-muted-foreground">
                      Márkaként nem tudsz pályázni saját vagy más hirdetésére.
                    </p>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-[#0b0d0a] font-semibold text-white hover:bg-accent hover:text-black"
                    >
                      <Link href="/login">Jelentkezem</Link>
                    </Button>
                  )}
                </div>

                <div className="mt-3 text-center">
                  <ReportButton
                    targetType="ad"
                    targetId={ad.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {referenceLinks.length > 0 && (
          <section className="border-t border-black/10 px-5 py-6 sm:px-7 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Referenciák
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
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
      </article>
    </div>
  );
}
