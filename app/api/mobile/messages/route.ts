import { desc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { resolveViewers } from "@/lib/viewers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett user beszélgetései (partnerenként a legutóbbi üzenettel). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const rows = await db
    .select({
      fromUserId: messages.fromUserId,
      toUserId: messages.toUserId,
      body: messages.body,
      read: messages.read,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(or(eq(messages.fromUserId, user.id), eq(messages.toUserId, user.id)))
    .orderBy(desc(messages.createdAt))
    .limit(500);

  type Conv = { partnerId: string; lastBody: string; lastAt: Date; unread: number };
  const byPartner = new Map<string, Conv>();
  for (const m of rows) {
    const partnerId = m.fromUserId === user.id ? m.toUserId : m.fromUserId;
    let conv = byPartner.get(partnerId);
    if (!conv) {
      conv = { partnerId, lastBody: m.body, lastAt: m.createdAt, unread: 0 };
      byPartner.set(partnerId, conv); // első = legutóbbi (desc rendezés miatt)
    }
    if (m.toUserId === user.id && !m.read) conv.unread++;
  }

  const list = [...byPartner.values()];
  const identities = await resolveViewers(list.map((c) => c.partnerId));

  const conversations = list
    .map((c) => {
      const id = identities.get(c.partnerId);
      return {
        partnerId: c.partnerId,
        name: id?.name ?? "Felhasználó",
        avatarUrl: id?.avatarUrl ?? null,
        lastBody: c.lastBody,
        lastAt: c.lastAt,
        unread: c.unread,
      };
    })
    .sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return Response.json({ conversations });
}
