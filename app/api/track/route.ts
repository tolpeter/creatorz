import { db } from "@/lib/db";
import { pageEvents } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * First-party látogatottság-mérés: oldalanként eltöltött idő fogadása
 * (sendBeacon-ból). A userId-t a bejelentkezési cookie-ból állapítjuk meg
 * (regisztrált vs nem regisztrált). Best-effort — hibánál sosem dob.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      path?: unknown;
      durationMs?: unknown;
    };
    const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
    const rawPath = typeof body.path === "string" ? body.path : "";
    const durationMs = typeof body.durationMs === "number" ? body.durationMs : 0;

    if (!sessionId || !rawPath) return Response.json({ ok: false }, { status: 400 });

    // 1 mp alatti és 30 percnél hosszabb mintát eldobunk / levágunk.
    const dur = Math.min(1_800_000, Math.round(durationMs));
    if (dur < 1000) return Response.json({ ok: true });

    // Query-stringet és töredéket levágjuk, hogy a path tiszta legyen.
    const path = rawPath.split(/[?#]/)[0]!.slice(0, 300);

    let userId: string | null = null;
    try {
      const user = await getCurrentUser();
      userId = user?.dbUser?.id ?? null;
    } catch {
      userId = null;
    }

    await db.insert(pageEvents).values({ sessionId, userId, path, durationMs: dur });
    return Response.json({ ok: true });
  } catch {
    // Sosem zavarjuk meg a felhasználói élményt egy mérési hibával.
    return Response.json({ ok: false }, { status: 200 });
  }
}
