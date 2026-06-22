import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { messages, notifications, creatorProfiles, brandProfiles, users } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";
import { sendMessageEmailThrottled } from "@/lib/email/message-throttle";
import { renderNewMessageEmail } from "@/lib/email/templates";
import { sendExpoPush } from "@/lib/push";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://creatorz.hu";

const schema = z.object({
  toUsername: z.string().min(1),
  body: z.string().min(1).max(5000),
});

/** Márka → tartalomgyártó: új beszélgetés indítása (a web sendMessage mobil párja). */
export async function POST(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (user.role !== "brand") {
    return Response.json({ error: "Csak márka indíthat üzenetet." }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Érvénytelen adatok" }, { status: 400 });
  const { toUsername, body } = parsed.data;

  const [recipient] = await db
    .select({
      creatorUserId: creatorProfiles.userId,
      displayName: creatorProfiles.displayName,
      email: users.email,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(eq(creatorProfiles.username, toUsername))
    .limit(1);
  if (!recipient) return Response.json({ error: "A címzett nem található" }, { status: 404 });

  const [brand] = await db
    .select({ companyName: brandProfiles.companyName })
    .from(brandProfiles)
    .where(eq(brandProfiles.userId, user.id))
    .limit(1);
  const senderName = brand?.companyName ?? "Egy márka";

  await db.insert(messages).values({
    fromUserId: user.id,
    toUserId: recipient.creatorUserId,
    body: body.trim(),
  });

  await db.insert(notifications).values({
    userId: recipient.creatorUserId,
    type: "message",
    title: `Új üzenet: ${senderName}`,
    body: body.slice(0, 120),
    link: "/creator/messages",
  });

  const email = renderNewMessageEmail({
    recipientName: recipient.displayName,
    senderName,
    preview: body.slice(0, 220),
    inboxUrl: `${APP_URL}/creator/messages`,
  });
  await sendMessageEmailThrottled(recipient.creatorUserId, recipient.email, email);
  await sendExpoPush([recipient.creatorUserId], {
    title: senderName,
    body: body.slice(0, 140),
    data: { type: "message", partnerId: user.id },
  });

  return Response.json({ success: true, partnerId: recipient.creatorUserId });
}
