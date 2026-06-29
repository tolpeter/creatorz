import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // A next/image által optimalizált képeket sokáig (31 nap) a Vercel CDN-en
    // tartjuk, hogy NE töltsük le újra meg újra a forrást a Supabase Storage-ból
    // — ez drasztikusan csökkenti a Supabase egresst. Biztonságos: a feltöltött
    // fájlok neve egyedi (UUID), így a hosszú cache sosem ad elavult képet.
    minimumCacheTTL: 2678400,
    // Modern formátumok — kisebb fájl, kevesebb sávszélesség.
    formats: ["image/avif", "image/webp"],
    // Engedélyezzük a verziózott (cache-bust) query stringet a saját képeinken.
    localPatterns: [
      { pathname: "/**", search: "" },
      { pathname: "/images/**", search: "v=2" },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
