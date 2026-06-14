import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Rezíliencia: ha az auth-hívás lassú/akad (pl. átmeneti rate limit), ne
  // ragassza be a kérést — max 3s, utána továbbengedjük (az oldal saját
  // getCurrentUser-e úgyis védi a privát route-okat).
  let user: Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"] = null;
  try {
    const res = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("auth-timeout")), 3000),
      ),
    ]);
    user = res.data.user;
  } catch {
    return supabaseResponse;
  }

  // Védett route-ok
  const url = request.nextUrl.clone();
  const protectedPaths = [
    "/creator",
    "/brand",
    "/admin",
    "/onboarding",
    "/dashboard",
    "/verify-email",
  ];
  // /verify-email/[token] — a token oldal mindenkinek elérhető (publikus link),
  // a /verify-email viszont csak bejelentkezetteknek (lásd protectedPaths).
  // Erre külön kezelés:
  const isVerifyEmailTokenPath =
    url.pathname.startsWith("/verify-email/") && url.pathname.length > "/verify-email/".length;
  const authPaths = ["/login", "/register"];

  // Szegmens-határ figyelembevétele: "/creators" (publikus) NEM "/creator" (védett)
  const isProtected =
    !isVerifyEmailTokenPath &&
    protectedPaths.some(
      (p) => url.pathname === p || url.pathname.startsWith(`${p}/`),
    );

  if (!user && isProtected) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal.data?.currentLevel !== "aal2" && aal.data?.nextLevel === "aal2") {
      url.pathname = "/mfa";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  const shouldShowLoginState =
    url.pathname === "/login" &&
    (url.searchParams.has("suspended") ||
      url.searchParams.has("missing_account") ||
      url.searchParams.has("error"));

  if (
    user &&
    authPaths.some((p) => url.pathname.startsWith(p)) &&
    !shouldShowLoginState
  ) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
