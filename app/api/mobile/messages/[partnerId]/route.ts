import { and, asc, eq, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { messages, notifications, users } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { resolveViewers } from "@/lib/viewers";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";
import { sendExpoPush } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

/** Beszélgetés-szál a partnerrel + olvasottra állítás. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { partnerId } = await params;

  const rows = await db
    .select({
      id: messages.id,
      fromUserId: messages.fromUserId,
      body: messages.body,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, user.id), eq(messages.toUserId, partnerId)),
        and(eq(messages.fromUserId, partnerId), eq(messages.toUserId, user.id)),
      ),
    )
    .orderBy(asc(messages.createdAt));

  // Olvasottra állítás (a partnertől hozzám érkezett, olvasatlanok)
  await db
    .update(messages)
    .set({ read: true })
    .where(
      and(
        eq(messages.fromUserId, partnerId),
        eq(messages.toUserId, user.id),
        eq(messages.read, false),
      ),
    );

  const identities = await resolveViewers([partnerId]);
  const partner = identities.get(partnerId);

  return Response.json({
    partner: { id: partnerId, name: partner?.name ?? "Felhasználó", avatarUrl: partner?.avatarUrl ?? null },
    messages: rows.map((m) => ({ ...m, mine: m.fromUserId === user.id })),
  });
}

const sendSchema = z.object({ body: z.string().min(1).max(5000) });

/** Válasz küldése — csak meglévő beszélgetésben (spam-védelem). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { partnerId } = await params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const parsed = sendSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Üres üzenet" }, { status: 400 });
  const body = parsed.data.body.trim();

  // Spam-védelem: csak ha már létezik beszélgetés a felekkel.
  const existing = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, user.id), eq(messages.toUserId, partnerId)),
        and(eq(messages.fromUserId, partnerId), eq(messages.toUserId, user.id)),
      ),
    )
    .limit(1);
  if (existing.length === 0) {
    return Response.json({ error: "Erre a felhasználóra még nincs beszélgetésed." }, { status: 403 });
  }

  // A partner email + szerep (értesítéshez)
  const [partnerRow] = await db
    .select({ email: users.email, role: users.role })
    .from(users)
    .where(eq(users.id, partnerId))
    .limit(1);
  if (!partnerRow) return Response.json({ error: "A címzett nem található" }, { status: 404 });

  await db.insert(messages).values({ fromUserId: user.id, toUserId: partnerId, body });

  const meName = (await resolveViewers([user.id])).get(user.id)?.name ?? "Felhasználó";
  const link =
    partnerRow.role === "brand"
      ? "/brand/messages"
      : partnerRow.role === "admin"
        ? "/admin/inbox"
        : "/creator/messages";

  await db.insert(notifications).values({
    userId: partnerId,
    type: "message",
    title: `Új üzenet: ${meName}`,
    body: body.slice(0, 120),
    link,
  });

  // Email + push (best-effort)
  const email = renderNewMessageEmail({
    recipientName: "",
    senderName: meName,
    preview: body.slice(0, 220),
    inboxUrl: `${APP_URL}${link}`,
  });
  await sendMessageEmailThrottled(partnerId, partnerRow.email, email);
  await sendExpoPush([partnerId], {
    title: meName,
    body: body.slice(0, 140),
    data: { type: "message", partnerId: user.id },
  });

  return Response.json({ success: true });
}
