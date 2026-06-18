import {
  and,
  or,
  eq,
  gte,
  lte,
  ilike,
  desc,
  asc,
  sql,
  type SQL,
} from "drizzle-orm";
import Image from "next/image";
import { MembersOnlyGate } from "@/components/layout/members-only-gate";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { AdCard, type AdCardData } from "@/components/ad/ad-card";
import { AdsFilters } from "@/components/ad/ads-filters";
import { AdsSortSelect } from "@/components/ad/ads-sort-select";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import {
  BriefcaseBusiness,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Hirdetések",
  description: "Aktív márka-hirdetések magyar UGC tartalomgyártóknak.",
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function AdsFeedPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  // Public-browse kapu: ha az admin kikapcsolta és nincs bejelentkezve → /login.
  const [publicView, currentUser] = await Promise.all([
    getSetting("public_view_ads").catch(() => false),
    getCurrentUser().catch(() => null),
  ]);
  if (!publicView && !currentUser) {
    return (
      <MembersOnlyGate
        next="/ads"
        title="A hirdetések böngészése csak tagoknak elérhető"
        description="Regisztrálj ingyen tartalomgyártóként, és máris láthatod a márkák aktív briefjeit, amikre pályázhatsz — vagy lépj be a fiókodba."
      />
    );
  }

  const conditions: SQL[] = [eq(ads.status, "active")];

  const categories = one(sp.categories)?.split(",").filter(Boolean) ?? [];
  if (categories.length) {
    conditions.push(
      or(
        ...categories.map(
          (c) => sql`${ads.categories} @> ${JSON.stringify([c])}::jsonb`,
        ),
      )!,
    );
  }

  const contentType = one(sp.contentType);
  if (
    contentType === "video" ||
    contentType === "photo" ||
    contentType === "both"
  )
    conditions.push(eq(ads.contentType, contentType));

  const collaborationType = one(sp.collaborationType);
  if (
    collaborationType === "project" ||
    collaborationType === "longterm" ||
    collaborationType === "barter"
  )
    conditions.push(eq(ads.collaborationType, collaborationType));

  const usageRights = one(sp.usageRights);
  if (usageRights) conditions.push(eq(ads.usageRights, usageRights));

  const location = one(sp.location);
  if (location) conditions.push(ilike(ads.location, `%${location}%`));

  const minBudget = one(sp.minBudget);
  if (minBudget && !isNaN(Number(minBudget)))
    conditions.push(
      and(eq(ads.budgetPublic, true), gte(ads.budgetMaxHuf, Number(minBudget)))!,
    );

  const deadline = one(sp.deadline);
  if (deadline === "week") {
    conditions.push(lte(ads.deadline, new Date(Date.now() + 7 * 86400000)));
  } else if (deadline === "month") {
    conditions.push(lte(ads.deadline, new Date(Date.now() + 30 * 86400000)));
  }

  const sort = one(sp.sort) ?? "newest";
  // A kiemelt hirdetések minden rendezésnél elöl jelennek meg.
  const orderBy =
    sort === "deadline"
      ? [desc(ads.isFeatured), asc(ads.deadline)]
      : sort === "budget"
        ? [desc(ads.isFeatured), desc(ads.budgetMaxHuf)]
        : [desc(ads.isFeatured), desc(ads.createdAt)];

  const rows = await db
    .select({
      id: ads.id,
      slug: ads.slug,
      title: ads.title,
      description: ads.description,
      categories: ads.categories,
      contentType: ads.contentType,
      collaborationType: ads.collaborationType,
      coverUrl: ads.coverUrl,
      budgetMinHuf: ads.budgetMinHuf,
      budgetMaxHuf: ads.budgetMaxHuf,
      budgetPublic: ads.budgetPublic,
      deadline: ads.deadline,
      applicationCount: ads.applicationCount,
      isFeatured: ads.isFeatured,
      anonymous: ads.anonymous,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(and(...conditions))
    .orderBy(...orderBy)
    .limit(60);

  const items: AdCardData[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    // Anonim hirdetésnél a publikus felületen elrejtjük a márka adatait
    brandName: r.anonymous ? "Bizalmas márka" : r.brandName,
    brandLogo: r.anonymous ? null : r.brandLogo,
    coverUrl: r.coverUrl,
    categories: r.categories ?? [],
    contentType: r.contentType,
    collaborationType: r.collaborationType,
    budgetMinHuf: r.budgetMinHuf,
    budgetMaxHuf: r.budgetMaxHuf,
    budgetPublic: r.budgetPublic,
    deadline: r.deadline,
    applicationCount: r.applicationCount,
    isFeatured: r.isFeatured,
    anonymous: r.anonymous,
  }));
  const activeFilterCount = [
    categories.length ? "c" : "",
    contentType,
    collaborationType,
    usageRights,
    deadline,
    location,
    minBudget,
  ].filter(Boolean).length;

  return (
    <div
      className="relative -my-6 bg-[#f6f7f2]"
      style={{
        marginLeft: "calc(50% - 50vw)",
        marginRight: "calc(50% - 50vw)",
        width: "100vw",
      }}
    >
      <div className="mx-auto max-w-[1500px] px-4 pt-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl bg-[#0b0d0a] text-white shadow-sm">
          {/* Jobb oldali creator-kép, balra elhalványuló overlay-jel */}
          <div className="absolute inset-y-0 right-0 hidden w-[46%] lg:block">
            <Image
              src="/images/generated/creatorz-creator-studio.webp"
              alt=""
              fill
              priority
              sizes="50vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(90deg,#0b0d0a_0%,rgba(11,13,10,0.65)_28%,rgba(11,13,10,0.1)_70%,transparent_100%)]"
            />
          </div>
          {/* Lime glow + villám-akcentus */}
          <div
            aria-hidden
            className="absolute -left-16 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-accent/20 blur-[120px]"
          />

          <div className="relative z-10 max-w-2xl px-6 py-10 sm:px-10 lg:py-14">
            <div className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Márka briefek
            </div>
            <h1 className="text-balance text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Hirdetések, amikből jó UGC együttműködések indulnak.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">
              Böngéssz kampánycél, kategória, formátum és határidő alapján —
              majd pályázz pár kattintással.
            </p>
            <div className="mt-6 grid max-w-[320px] grid-cols-2 gap-2">
              {[
                { label: "aktív brief", value: items.length },
                { label: "aktív szűrő", value: activeFilterCount },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3"
                >
                  <p className="truncate text-xl font-black">{stat.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-white/55">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="mx-auto grid max-w-[1500px] gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border-b border-black/10 bg-white/90 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <details className="lg:hidden">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Szűrők
              </span>
              {activeFilterCount > 0 && (
                <Badge className="bg-accent text-black hover:bg-accent">
                  {activeFilterCount}
                </Badge>
              )}
            </summary>
            <div className="border-t p-4">
              <AdsFilters />
            </div>
          </details>
          <div className="hidden p-5 lg:block">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold">Szűrők</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Válaszd ki a neked releváns márkákat, formátumokat és
                  bérezést.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                {activeFilterCount > 0 && (
                  <Badge className="bg-accent text-black hover:bg-accent">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>
            </div>
            <AdsFilters />
          </div>
        </aside>

        <div className="min-w-0 space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Aktív kampányok
              </p>
              <h2 className="mt-1 text-2xl font-bold">Hirdetések böngészése</h2>
              <p className="text-sm text-muted-foreground">
                {items.length} aktív hirdetés a beállított szűrőkkel.
              </p>
            </div>
            <AdsSortSelect />
          </div>
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center text-muted-foreground">
              Jelenleg nincs a szűrőknek megfelelő aktív hirdetés.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((a) => (
                <AdCard key={a.id} ad={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
