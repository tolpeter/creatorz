import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, tiktokConnections } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import { exchangeCode, fetchUserInfo } from "@/lib/tiktok/oauth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * TikTok Login Kit callback: az authorization code beváltása, a hivatalos
 * statok (követő, like, videószám) behúzása, és a tokenek elmentése.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const back = (status: string) =>
    NextResponse.redirect(new URL(`/creator/profile?tiktok=${status}`, env.appUrl));

  const store = await cookies();
  const stateCookie = store.get("tiktok_oauth_state")?.value;

  if (oauthError || !code || !state || !stateCookie || state !== stateCookie) {
    return back("error");
  }

  const creator = await getCurrentCreator();
  if (!creator) return NextResponse.redirect(new URL("/login", env.appUrl));

  const token = await exchangeCode(code);
  if (!token) return back("error");

  const info = await fetchUserInfo(token.access_token);
  if (!info) return back("error");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + (token.expires_in || 0) * 1000);
  const refreshExpiresAt = new Date(now.getTime() + (token.refresh_expires_in || 0) * 1000);
  const openId = info.openId || token.open_id;

  // Tokenek mentése (külön táblában) — upsert userId-ra.
  await db
    .insert(tiktokConnections)
    .values({
      userId: creator.appUserId,
      openId,
      unionId: info.unionId,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      scope: token.scope,
      expiresAt,
      refreshExpiresAt,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: tiktokConnections.userId,
      set: {
        openId,
        unionId: info.unionId,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        scope: token.scope,
        expiresAt,
        refreshExpiresAt,
        updatedAt: now,
      },
    });

  // Hivatalos statok a profilra.
  const set: Record<string, unknown> = {
    tiktokOfficial: true,
    tiktokVerified: true,
    tiktokLastChecked: now,
    updatedAt: now,
  };
  if (info.followerCount != null) set.tiktokFollowers = info.followerCount;
  if (info.likesCount != null) set.tiktokLikes = info.likesCount;
  if (info.videoCount != null) set.tiktokVideoCount = info.videoCount;
  const profileUrl = info.profileDeepLink || (info.username ? `https://www.tiktok.com/@${info.username}` : null);
  if (profileUrl) set.tiktokUrl = profileUrl;

  await db.update(creatorProfiles).set(set).where(eq(creatorProfiles.id, creator.profile.id));

  const res = back("connected");
  res.cookies.delete("tiktok_oauth_state");
  return res;
}
