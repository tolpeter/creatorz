import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
