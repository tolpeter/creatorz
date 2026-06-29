import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { dashboardPathForRole } from "@/lib/auth";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();
  let authedUserId: string | null = null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    authedUserId = data.user?.id ?? null;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }
    authedUserId = data.user?.id ?? null;
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Van-e már app `users` sor? Ha nincs (új OAuth/Google-felhasználó), a
  // szerepkör-választóra küldjük, ahol befejezi a regisztrációt.
  let destination = next ?? "/dashboard";
  if (authedUserId) {
    const rows = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.authId, authedUserId))
      .limit(1);
    if (!rows[0]) {
      // Ha a Google-gomb átadta a szerepkört, vigyük tovább → kimarad a választó.
      const p = new URLSearchParams();
      for (const k of ["role", "profileKind", "creatorType"]) {
        const v = searchParams.get(k);
        if (v) p.set(k, v);
      }
      const qs = p.toString();
      destination = `/regisztracio-google${qs ? `?${qs}` : ""}`;
    } else if (!next) {
      destination = dashboardPathForRole(rows[0].role);
    }
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
