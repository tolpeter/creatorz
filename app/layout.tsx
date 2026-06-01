import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CookieBanner } from "@/components/shared/cookie-banner";

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
    default: "Creatorz — Magyar UGC tartalomgyártó platform",
    template: "%s | Creatorz",
  },
  description:
    "Találd meg a tökéletes magyar UGC tartalomgyártót a márkádhoz, vagy regisztrálj creatorként és kezdj el dolgozni magyar brandekkel.",
  keywords: [
    "UGC",
    "tartalomgyártó",
    "magyar creator",
    "influencer marketing",
    "márka tartalom",
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
        url: "/images/generated/og-image.webp",
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
        <TooltipProvider>{children}</TooltipProvider>
        <CookieBanner />
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
