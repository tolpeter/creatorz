import { NextResponse } from "next/server";
import { getCurrentCreator } from "@/lib/auth";
import { buildAuthorizeUrl, tiktokConfigured } from "@/lib/tiktok/oauth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * TikTok Login Kit indítása: a bejelentkezett creatort átirányítjuk a TikTok
 * authorizáló oldalára. CSRF-védelem: véletlen `state` httpOnly cookie-ban.
 */
export async function GET() {
  const creator = await getCurrentCreator();
  if (!creator) {
    return NextResponse.redirect(new URL("/login", env.appUrl));
  }
  if (!tiktokConfigured()) {
    return NextResponse.redirect(new URL("/creator/profile?tiktok=unconfigured", env.appUrl));
  }

  const state = crypto.randomUUID();
  const res = NextResponse.redirect(buildAuthorizeUrl(state));
  res.cookies.set("tiktok_oauth_state", state, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 perc
  });
  return res;
}
