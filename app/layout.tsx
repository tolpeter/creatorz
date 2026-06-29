import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/shared/cookie-banner";
import { Analytics } from "@/components/analytics/analytics";
import { MetaPixel } from "@/components/analytics/meta-pixel";
import { PageTimeTracker } from "@/components/analytics/page-time-tracker";
import "@/lib/env";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Creatorz — UGC tartalomgyártók, influencerek és modellek egy helyen",
    template: "%s | Creatorz",
  },
  description:
    "A magyar alkotói piactér: UGC tartalomgyártók, influencerek, modellek, fotósok és operatőrök. Alkotóként munkákat találsz és megkereséseket kapsz; márkaként kampányt adsz fel, és egy helyen, kényelmesen szűröd a jelentkezőket — nem 50 emailből és Facebook-üzenetből.",
  keywords: [
    "UGC tartalomgyártó",
    "influencer",
    "modell",
    "magyar alkotók",
    "influencer marketing",
    "kampány",
    "márka együttműködés",
    "fotós",
    "operatőr",
  ],
  authors: [{ name: "Creatorz" }],
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    type: "website",
    locale: "hu_HU",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Creatorz",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Creatorz",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Creatorz",
                url: process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu",
                logo: `${process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu"}/og-image.png`,
                description:
                  "Magyar alkotói piactér — UGC tartalomgyártók, influencerek, modellek, fotósok és operatőrök; márkák és alkotók közvetlen összekötése.",
                email: "info@creatorz.hu",
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Creatorz",
                url: process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu",
                inLanguage: "hu-HU",
              },
            ]),
          }}
        />
        <Analytics />
        <MetaPixel />
        <PageTimeTracker />
        <TooltipProvider>{children}</TooltipProvider>
        <CookieBanner />
        <Toaster />
      </body>
    </html>
  );
}
