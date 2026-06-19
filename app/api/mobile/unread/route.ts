import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, notifications } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Olvasatlan üzenet- és értesítés-szám a fülek/csengő badge-ekhez. */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ messages: 0, notifications: 0 });

  const [m, n] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(messages)
      .where(and(eq(messages.toUserId, user.id), eq(messages.read, false))),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false))),
  ]);

  return Response.json({ messages: m[0]?.c ?? 0, notifications: n[0]?.c ?? 0 });
}
