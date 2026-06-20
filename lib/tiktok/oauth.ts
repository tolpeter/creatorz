import "server-only";

/**
 * Hivatalos TikTok Login Kit (OAuth 2.0) + Display API segédfüggvények.
 * Dokumentáció: https://developers.tiktok.com/doc/login-kit-web
 *
 * Szükséges env változók:
 *   TIKTOK_CLIENT_KEY    – a TikTok fejlesztői app client key-e
 *   TIKTOK_CLIENT_SECRET – a client secret
 *   NEXT_PUBLIC_APP_URL  – a redirect URI bázisa
 *
 * A redirect URI: `${APP_URL}/api/auth/tiktok/callback` — ezt regisztrálni
 * kell a TikTok fejlesztői portálon is.
 */

const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USERINFO_URL = "https://open.tiktokapis.com/v2/user/info/";

// A statokhoz szükséges scope-ok (a TikTok app review során kell engedélyezni).
export const TIKTOK_SCOPES = "user.info.basic,user.info.profile,user.info.stats";

export function tiktokConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

export function tiktokRedirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/auth/tiktok/callback`;
}

/** Az authorizáló URL, ahová a felhasználót átirányítjuk. */
export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    scope: TIKTOK_SCOPES,
    response_type: "code",
    redirect_uri: tiktokRedirectUri(),
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
}

export type TikTokToken = {
  access_token: string;
  refresh_token: string;
  open_id: string;
  scope: string;
  expires_in: number; // másodperc
  refresh_expires_in: number;
  token_type: string;
};

/** Authorization code → access/refresh token. */
export async function exchangeCode(code: string): Promise<TikTokToken | null> {
  return tokenRequest({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
    code,
    grant_type: "authorization_code",
    redirect_uri: tiktokRedirectUri(),
  });
}

/** Refresh token → új access token. */
export async function refreshAccessToken(refreshToken: string): Promise<TikTokToken | null> {
  return tokenRequest({
    client_key: process.env.TIKTOK_CLIENT_KEY || "",
    client_secret: process.env.TIKTOK_CLIENT_SECRET || "",
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
}

async function tokenRequest(body: Record<string, string>): Promise<TikTokToken | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString(),
      cache: "no-store",
    });
    const json = (await res.json()) as Partial<TikTokToken> & { error?: string; error_description?: string };
    if (!res.ok || json.error || !json.access_token || !json.open_id) {
      console.error("[tiktok] token error:", json.error, json.error_description);
      return null;
    }
    return json as TikTokToken;
  } catch (err) {
    console.error("[tiktok] token request failed:", (err as Error).message);
    return null;
  }
}

export type TikTokUserInfo = {
  openId: string;
  unionId: string | null;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  profileDeepLink: string | null;
  followerCount: number | null;
  likesCount: number | null;
  videoCount: number | null;
};

/** A felhasználó hivatalos adatai (követő, like, videószám) a Display API-ból. */
export async function fetchUserInfo(accessToken: string): Promise<TikTokUserInfo | null> {
  const fields = [
    "open_id",
    "union_id",
    "username",
    "display_name",
    "avatar_url",
    "profile_deep_link",
    "follower_count",
    "likes_count",
    "video_count",
  ].join(",");
  try {
    const res = await fetch(`${USERINFO_URL}?fields=${encodeURIComponent(fields)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const json = (await res.json()) as {
      data?: { user?: Record<string, unknown> };
      error?: { code?: string; message?: string };
    };
    const u = json.data?.user;
    if (!res.ok || (json.error && json.error.code && json.error.code !== "ok") || !u) {
      console.error("[tiktok] userinfo error:", json.error?.code, json.error?.message);
      return null;
    }
    const num = (v: unknown): number | null =>
      typeof v === "number" && Number.isFinite(v) ? v : null;
    const str = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
    return {
      openId: str(u.open_id) ?? "",
      unionId: str(u.union_id),
      username: str(u.username),
      displayName: str(u.display_name),
      avatarUrl: str(u.avatar_url),
      profileDeepLink: str(u.profile_deep_link),
      followerCount: num(u.follower_count),
      likesCount: num(u.likes_count),
      videoCount: num(u.video_count),
    };
  } catch (err) {
    console.error("[tiktok] userinfo failed:", (err as Error).message);
    return null;
  }
}
