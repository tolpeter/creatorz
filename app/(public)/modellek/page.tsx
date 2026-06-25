import type { Metadata } from "next";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { creatorsByType, countByType } from "@/lib/seo/creator-queries";
import { SeoCreatorLanding, type SeoRelatedLink } from "@/components/creator/seo-creator-landing";
import { MembersOnlyGate } from "@/components/layout/members-only-gate";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";

export const dynamic = "force-dynamic";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

export const metadata: Metadata = {
  title: "Modellek — magyar modellek márkáknak | Creatorz",
  description:
    "Találd meg a megfelelő magyar modellt termék- és divatfotózáshoz: portfólió, értékelések, közvetlen kapcsolat. Márkaként ingyen adhatsz fel briefet.",
  alternates: { canonical: `${APP_URL}/modellek` },
  openGraph: {
    title: "Modellek — magyar modellek márkáknak | Creatorz",
    description: "Magyar modellek egy helyen — portfólió, értékelések, közvetlen kapcsolatfelvétel.",
    url: `${APP_URL}/modellek`,
    type: "website",
  },
};

export default async function ModelsPage() {
  // Tagoknak: ugyanaz a kapu, mint a /creators böngészőnél.
  const [publicView, currentUser] = await Promise.all([
    getSetting("public_view_creators").catch(() => false),
    getCurrentUser().catch(() => null),
  ]);
  if (!publicView && !currentUser) {
    return (
      <MembersOnlyGate
        next="/modellek"
        title="A modellek böngészése csak tagoknak elérhető"
        description="Regisztrálj ingyen, és máris böngészheted a magyar modelleket, vagy lépj be a fiókodba."
      />
    );
  }

  const [creators, total] = await Promise.all([
    creatorsByType("model", 24),
    countByType("model"),
  ]);

  const related: SeoRelatedLink[] = [
    { label: "Influenszerek", href: "/influenszerek" },
    { label: "UGC tartalomgyártók", href: "/creators?tipus=ugc" },
    ...CREATOR_CATEGORIES.slice(0, 8).map((c) => ({
      label: `${c.emoji} ${c.label}`,
      href: `/ugc/${c.value}`,
    })),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Magyar modellek",
    url: `${APP_URL}/modellek`,
    inLanguage: "hu-HU",
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SeoCreatorLanding
        eyebrow="Modellek"
        title="Magyar modellek márkáknak"
        intro="Keresel modellt termék- vagy divatfotózáshoz? Itt a magyar modellek egy helyen — portfólió és értékelések alapján választhatsz, a kapcsolatfelvétel pedig közvetlen. Márkaként ingyen adhatsz fel briefet, amire a modellek jelentkeznek."
        creators={creators}
        totalCount={total}
        related={related}
        relatedTitle="Kategóriák és további típusok"
      />
    </>
  );
}
