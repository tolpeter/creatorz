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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Védett route-ok
  const url = request.nextUrl.clone();
  const protectedPaths = ["/creator", "/brand", "/admin", "/onboarding", "/dashboard"];
  const authPaths = ["/login", "/register"];

  // Szegmens-határ figyelembevétele: "/creators" (publikus) NEM "/creator" (védett)
  const isProtected = protectedPaths.some(
    (p) => url.pathname === p || url.pathname.startsWith(`${p}/`)
  );

  if (!user && isProtected) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && authPaths.some((p) => url.pathname.startsWith(p))) {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
