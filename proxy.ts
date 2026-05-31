import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

// Next.js 16: a korábbi `middleware` konvenció helyett `proxy`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
