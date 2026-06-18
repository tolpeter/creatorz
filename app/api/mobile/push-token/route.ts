import { db } from "@/lib/db";
import { pushTokens } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A mobil app elküldi az Expo push tokenjét bejelentkezés után. */
export async function POST(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let body: { token?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const token = (body.token ?? "").trim();
  if (!token.startsWith("ExponentPushToken")) {
    return Response.json({ error: "invalid token" }, { status: 400 });
  }

  // Token mentése; ha már létezik, az adott userhez kötjük (eszközváltás).
  await db
    .insert(pushTokens)
    .values({ userId: user.id, token, platform: body.platform ?? null })
    .onConflictDoUpdate({
      target: pushTokens.token,
      set: { userId: user.id, platform: body.platform ?? null },
    });

  return Response.json({ success: true });
}
