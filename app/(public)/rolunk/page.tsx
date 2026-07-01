import type { Metadata } from "next";
import { AboutPage } from "@/components/public/about-page";

export const metadata: Metadata = {
  title: "Rólunk — A Creatorz története",
  description:
    "A Creatorz küldetése: átláthatóvá és elérhetővé tenni a magyar tartalomgyártó-piacot — hogy bárki, akinek van közönsége vagy tehetsége, munkát találjon, és bármely cég pillanatok alatt megtalálja a megfelelő alkotót.",
  alternates: { canonical: "/rolunk" },
  openGraph: {
    title: "Rólunk — A Creatorz története",
    description:
      "Egy platform, amely egyszerre képviseli a tartalomgyártókat, influencereket, modelleket és a márkákat.",
    url: "/rolunk",
    type: "website",
  },
};

export default function RolunkPage() {
  return <AboutPage />;
}
