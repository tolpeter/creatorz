import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { creatorsByCategory, countByCategory } from "@/lib/seo/creator-queries";
import { COUNTY_SLUGS } from "@/lib/seo/regions";
import { SeoCreatorLanding } from "@/components/creator/seo-creator-landing";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

function findCategory(slug: string) {
  return CREATOR_CATEGORIES.find((c) => c.value === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ kategoria: string }>;
}): Promise<Metadata> {
  const { kategoria } = await params;
  const cat = findCategory(kategoria);
  if (!cat) return { title: "Nincs ilyen kategória" };
  const title = `${cat.label} UGC tartalomgyártók — Creatorz`;
  const description = `${cat.label} kategóriás magyar UGC tartalomgyártók egy helyen: hiteles követőszámok, értékelések, közvetlen kapcsolat. Márkaként ingyen adhatsz fel briefet.`;
  const url = `${APP_URL}/ugc/${cat.value}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website" },
  };
}

export default async function CategoryLandingPage({
  params,
}: {
  params: Promise<{ kategoria: string }>;
}) {
  const { kategoria } = await params;
  const cat = findCategory(kategoria);
  if (!cat) notFound();

  const [creators, total] = await Promise.all([
    creatorsByCategory(cat.value, 24),
    countByCategory(cat.value),
  ]);

  const related = [
    ...CREATOR_CATEGORIES.filter((c) => c.value !== cat.value).map((c) => ({
      label: `${c.emoji} ${c.label}`,
      href: `/ugc/${c.value}`,
    })),
    ...COUNTY_SLUGS.slice(0, 6).map((c) => ({
      label: c.county,
      href: `/ugc/megye/${c.slug}`,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${cat.label} UGC tartalomgyártók`,
    url: `${APP_URL}/ugc/${cat.value}`,
    inLanguage: "hu-HU",
    about: `${cat.label} UGC tartalomgyártók Magyarországon`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SeoCreatorLanding
        eyebrow={`${cat.emoji} ${cat.label}`}
        title={`${cat.label} UGC tartalomgyártók`}
        intro={`Böngészd a(z) ${cat.label.toLowerCase()} kategória magyar UGC tartalomgyártóit a Creatorzon. Hiteles követőszámok és értékelések alapján választhatsz, a kapcsolatfelvétel pedig közvetlen. Márkaként ingyen adhatsz fel briefet, és a hozzád illő alkotók jelentkeznek.`}
        creators={creators}
        totalCount={total}
        related={related}
        relatedTitle="További kategóriák és régiók"
      />
    </>
  );
}
