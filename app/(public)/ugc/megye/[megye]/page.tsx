import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { creatorsByCounty, countByCounty } from "@/lib/seo/creator-queries";
import { countyFromSlug, COUNTY_SLUGS } from "@/lib/seo/regions";
import { SeoCreatorLanding } from "@/components/creator/seo-creator-landing";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ megye: string }>;
}): Promise<Metadata> {
  const { megye } = await params;
  const county = countyFromSlug(megye);
  if (!county) return { title: "Nincs ilyen megye" };
  const title = `UGC tartalomgyártók — ${county} | Creatorz`;
  const description = `${county} megyei magyar UGC tartalomgyártók: hiteles követőszámok, értékelések, közvetlen kapcsolat. Márkaként ingyen adhatsz fel briefet.`;
  const url = `${APP_URL}/ugc/megye/${megye}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function CountyLandingPage({
  params,
}: {
  params: Promise<{ megye: string }>;
}) {
  const { megye } = await params;
  const county = countyFromSlug(megye);
  if (!county) notFound();

  const [creators, total] = await Promise.all([
    creatorsByCounty(county, 24),
    countByCounty(county),
  ]);

  const related = [
    ...COUNTY_SLUGS.filter((c) => c.county !== county).map((c) => ({
      label: c.county,
      href: `/ugc/megye/${c.slug}`,
    })),
    ...CREATOR_CATEGORIES.slice(0, 6).map((c) => ({
      label: `${c.emoji} ${c.label}`,
      href: `/ugc/${c.value}`,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `UGC tartalomgyártók — ${county}`,
    url: `${APP_URL}/ugc/megye/${megye}`,
    inLanguage: "hu-HU",
    about: `UGC tartalomgyártók ${county} megyében`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoCreatorLanding
        eyebrow={county}
        title={`UGC tartalomgyártók — ${county}`}
        intro={`Keresel ${county} megyei UGC tartalomgyártót? Itt a környékbeli magyar alkotók egy helyen — hiteles követőszámok és értékelések alapján. A kapcsolatfelvétel közvetlen, márkaként pedig ingyen adhatsz fel briefet, amire a helyi alkotók jelentkeznek.`}
        creators={creators}
        totalCount={total}
        related={related}
        relatedTitle="További megyék és kategóriák"
      />
    </>
  );
}
