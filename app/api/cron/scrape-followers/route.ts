import { db } from "@/lib/db";
import { creatorProfiles } from "@/lib/db/schema";
import { eq, or, isNotNull } from "drizzle-orm";
import { scrapeInstagramFollowers } from "@/lib/scrapers/instagram";
import { scrapeTikTokStats } from "@/lib/scrapers/tiktok";
import { scrapeFacebookFollowers } from "@/lib/scrapers/facebook";
import { fetchYouTubeSubscribers } from "@/lib/scrapers/youtube";

export const maxDuration = 300; // 4 naponta futó cron: végigellenőrzi az összes linket, frissíti a követő/feliratkozó számokat

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const creators = await db
    .select()
    .from(creatorProfiles)
    .where(
      or(
        isNotNull(creatorProfiles.instagramUrl),
        isNotNull(creatorProfiles.tiktokUrl),
        isNotNull(creatorProfiles.facebookUrl),
        isNotNull(creatorProfiles.youtubeUrl)
      )
    );

  let scraped = 0;
  let updated = 0;
  const now = new Date();

  for (const c of creators) {
    scraped++;
    const updates: Record<string, unknown> = {};

    // Mindegyik platform hibatűrő: egy hiba nem állítja le a többit.
    if (c.instagramUrl) {
      try {
        const n = await scrapeInstagramFollowers(c.instagramUrl);
        if (n !== null) {
          updates.instagramFollowers = n;
          updates.instagramVerified = true;
          updates.instagramLastChecked = now;
        }
      } catch {
        /* ignore */
      }
    }
    if (c.tiktokUrl) {
      try {
        const stats = await scrapeTikTokStats(c.tiktokUrl);
        if (stats.followers !== null) {
          updates.tiktokFollowers = stats.followers;
          if (stats.likes != null) updates.tiktokLikes = stats.likes;
          if (stats.avgViews != null) updates.tiktokAvgViews = stats.avgViews;
          if (stats.videoCount != null) updates.tiktokVideoCount = stats.videoCount;
          updates.tiktokVerified = true;
          updates.tiktokLastChecked = now;
        }
      } catch {
        /* ignore */
      }
    }
    if (c.facebookUrl) {
      try {
        const n = await scrapeFacebookFollowers(c.facebookUrl);
        if (n !== null) {
          updates.facebookFollowers = n;
          updates.facebookVerified = true;
          updates.facebookLastChecked = now;
        }
      } catch {
        /* ignore */
      }
    }
    if (c.youtubeUrl) {
      try {
        const n = await fetchYouTubeSubscribers(c.youtubeUrl);
        if (n !== null) {
          updates.youtubeSubscribers = n;
          updates.youtubeVerified = true;
          updates.youtubeLastChecked = now;
        }
      } catch {
        /* ignore */
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = now;
      await db.update(creatorProfiles).set(updates).where(eq(creatorProfiles.id, c.id));
      updated++;
    }

    // Kis szünet a platformok rate-limitje miatt
    await new Promise((r) => setTimeout(r, 1500));
  }

  return Response.json({ scraped, updated });
}
