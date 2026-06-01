import type { MetadataRoute } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, ads } from "@/lib/db/schema";

// Runtime-os: nem build-időben generálódik (DB kapcsolat kell hozzá).
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0, changeFrequency: "daily" },
    { url: `${baseUrl}/creators`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/ads`, lastModified: new Date(), priority: 0.9, changeFrequency: "daily" },
    { url: `${baseUrl}/aszf`, lastModified: new Date(), priority: 0.3 },
    { url: `${baseUrl}/adatvedelem`, lastModified: new Date(), priority: 0.3 },
    { url: `${baseUrl}/cookies`, lastModified: new Date(), priority: 0.3 },
    { url: `${baseUrl}/kapcsolat`, lastModified: new Date(), priority: 0.5 },
  ];

  const creators = await db
    .select({ username: creatorProfiles.username, updatedAt: creatorProfiles.updatedAt })
    .from(creatorProfiles);

  const creatorPages: MetadataRoute.Sitemap = creators.map((c) => ({
    url: `${baseUrl}/creators/${c.username}`,
    lastModified: c.updatedAt,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  const activeAds = await db
    .select({ id: ads.id, updatedAt: ads.createdAt })
    .from(ads)
    .where(eq(ads.status, "active"));

  const adPages: MetadataRoute.Sitemap = activeAds.map((a) => ({
    url: `${baseUrl}/ads/${a.id}`,
    lastModified: a.updatedAt,
    priority: 0.6,
  }));

  return [...staticPages, ...creatorPages, ...adPages];
}
