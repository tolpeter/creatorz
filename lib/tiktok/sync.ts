import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, tiktokConnections } from "@/lib/db/schema";
import { fetchUserInfo, fetchUserVideos, refreshAccessToken } from "@/lib/tiktok/oauth";

/**
 * A hivatalosan összekötött TikTok-fiók statjainak frissítése: access token
 * megújítása, majd a Display API-ból a követő/like/videószám behúzása és mentése.
 * Best-effort — hibánál false, a régi (tárolt) statok megmaradnak.
 */
export async function syncOfficialTikTok(userId: string): Promise<boolean> {
  const [conn] = await db
    .select()
    .from(tiktokConnections)
    .where(eq(tiktokConnections.userId, userId))
    .limit(1);
  if (!conn) return false;

  const now = new Date();
  let accessToken = conn.accessToken;

  // Az access token ~24h-ig él → mindig megújítjuk a refresh tokennel.
  const refreshed = await refreshAccessToken(conn.refreshToken);
  if (refreshed) {
    accessToken = refreshed.access_token;
    await db
      .update(tiktokConnections)
      .set({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token,
        scope: refreshed.scope,
        expiresAt: new Date(now.getTime() + (refreshed.expires_in || 0) * 1000),
        refreshExpiresAt: new Date(now.getTime() + (refreshed.refresh_expires_in || 0) * 1000),
        updatedAt: now,
      })
      .where(eq(tiktokConnections.userId, userId));
  } else if (conn.expiresAt && conn.expiresAt.getTime() < now.getTime()) {
    // Lejárt access token + sikertelen refresh → nem tudunk lekérni.
    return false;
  }

  const info = await fetchUserInfo(accessToken);
  if (!info) return false;

  const set: Record<string, unknown> = {
    tiktokOfficial: true,
    tiktokVerified: true,
    tiktokLastChecked: now,
    updatedAt: now,
  };
  if (info.followerCount != null) set.tiktokFollowers = info.followerCount;
  if (info.likesCount != null) set.tiktokLikes = info.likesCount;
  if (info.videoCount != null) set.tiktokVideoCount = info.videoCount;

  // Publikus videók frissítése (video.list). Ha üres (nincs scope/videó), nem írjuk felül.
  const videos = await fetchUserVideos(accessToken);
  if (videos.length) set.tiktokVideos = videos;

  await db.update(creatorProfiles).set(set).where(eq(creatorProfiles.userId, userId));
  return true;
}
