import type { Metadata } from "next";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { creatorsByType, countByType } from "@/lib/seo/creator-queries";
import { SeoCreatorLanding, type SeoRelatedLink } from "@/components/creator/seo-creator-landing";

export const dynamic = "force-dynamic";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

export const metadata: Metadata = {
  title: "Influenszerek — magyar influenszer marketing | Creatorz",
  description:
    "Találd meg a megfelelő magyar influenszert a márkádnak: hiteles követőszámok, értékelések, közvetlen kapcsolat. Márkaként ingyen adhatsz fel briefet.",
  alternates: { canonical: `${APP_URL}/influenszerek` },
  openGraph: {
    title: "Influenszerek — magyar influenszer marketing | Creatorz",
    description: "Magyar influenszerek egy helyen — hiteles statok, közvetlen kapcsolatfelvétel.",
    url: `${APP_URL}/influenszerek`,
    type: "website",
  },
};

export default async function InfluencersPage() {
  const [creators, total] = await Promise.all([
    creatorsByType("influencer", 24),
    countByType("influencer"),
  ]);

  const related: SeoRelatedLink[] = [
    { label: "Modellek", href: "/modellek" },
    { label: "UGC tartalomgyártók", href: "/creators?tipus=ugc" },
    ...CREATOR_CATEGORIES.slice(0, 8).map((c) => ({
      label: `${c.emoji} ${c.label}`,
      href: `/ugc/${c.value}`,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Magyar influenszerek",
    url: `${APP_URL}/influenszerek`,
    inLanguage: "hu-HU",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoCreatorLanding
        eyebrow="Influenszerek"
        title="Magyar influenszerek a márkádnak"
        intro="Keresel influenszert egy kampányhoz? Itt a magyar influenszerek egy helyen — a saját közönségüknek posztolnak, te pedig hiteles követőszámok és értékelések alapján választhatsz. A kapcsolatfelvétel közvetlen, márkaként ingyen adhatsz fel briefet."
        creators={creators}
        totalCount={total}
        related={related}
        relatedTitle="Kategóriák és további típusok"
      />
    </>
  );
}
