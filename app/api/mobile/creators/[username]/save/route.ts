import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { savedCreators, creatorProfiles, brandProfiles, notifications } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Tartalomgyártó mentése/eltávolítása a márka kedvenceiből (toggle). */
export async function POST(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "brand") return Response.json({ error: "Csak márka menthet" }, { status: 403 });
  const { username } = await params;

  const [brand] = await db
    .select({ id: brandProfiles.id })
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);
  const [creator] = await db
    .select({ id: creatorProfiles.id, userId: creatorProfiles.userId })
    .from(creatorProfiles)
    .where(eq(creatorProfiles.username, username))
    .limit(1);
  if (!brand || !creator) return Response.json({ error: "not found" }, { status: 404 });

  const existing = await db
    .select({ creatorId: savedCreators.creatorId })
    .from(savedCreators)
    .where(and(eq(savedCreators.brandId, brand.id), eq(savedCreators.creatorId, creator.id)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(savedCreators)
      .where(and(eq(savedCreators.brandId, brand.id), eq(savedCreators.creatorId, creator.id)));
    return Response.json({ saved: false });
  }

  const inserted = await db
    .insert(savedCreators)
    .values({ brandId: brand.id, creatorId: creator.id })
    .onConflictDoNothing()
    .returning({ creatorId: savedCreators.creatorId });

  // Értesítés a tartalomgyártónak — a márka NEVE nélkül (csak hogy elmentették).
  if (inserted[0]) {
    try {
      await db.insert(notifications).values({
        userId: creator.userId,
        type: "saved",
        title: "Felvettek a kedvencek közé ⭐",
        body: "Egy márka elmentette a profilodat a kedvencei közé.",
        link: "/creator",
      });
    } catch {
      // best-effort
    }
  }

  return Response.json({ saved: true });
}
