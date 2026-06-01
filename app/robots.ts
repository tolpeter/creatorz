import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/creator/", "/brand/", "/dashboard", "/onboarding/", "/login", "/register", "/review/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
