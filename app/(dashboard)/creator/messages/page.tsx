import { redirect } from "next/navigation";
import { and, eq, or, asc, sql } from "drizzle-orm";
import { Info } from "lucide-react";
import { db } from "@/lib/db";
import { messages, users, brandProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getMyCollabEvents } from "@/app/actions/collaborations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyForm } from "@/components/shared/reply-form";
import { MessageThread, type ThreadItem } from "@/components/shared/message-thread";

export const metadata = { title: "Üzenetek" };

export default async function CreatorMessagesPage() {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  const myId = current.dbUser.id;

  await db
    .update(messages)
    .set({ read: true })
    .where(and(eq(messages.toUserId, myId), eq(messages.read, false)));

  const all = await db
    .select({
      id: messages.id,
      fromUserId: messages.fromUserId,
      toUserId: messages.toUserId,
      subject: messages.subject,
      body: messages.body,
      budgetHint: messages.budgetHint,
      attachmentUrl: messages.attachmentUrl,
      attachmentName: messages.attachmentName,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(or(eq(messages.fromUserId, myId), eq(messages.toUserId, myId)))
    .orderBy(asc(messages.createdAt));

  const collabEvents = await getMyCollabEvents();
  const eventsByPartner = new Map<string, typeof collabEvents>();
  for (const e of collabEvents) {
    const arr = eventsByPartner.get(e.partnerUserId) ?? [];
    arr.push(e);
    eventsByPartner.set(e.partnerUserId, arr);
  }

  const otherIds = Array.from(
    new Set(all.map((m) => (m.fromUserId === myId ? m.toUserId : m.fromUserId))),
  );

  const partners = otherIds.length
    ? await db
        .select({
          userId: users.id,
          email: users.email,
          brandName: brandProfiles.companyName,
          brandLogo: brandProfiles.logoUrl,
        })
        .from(users)
        .leftJoin(brandProfiles, eq(brandProfiles.userId, users.id))
        .where(sql`${users.id} in ${otherIds}`)
    : [];
  const partnerMap = new Map(partners.map((p) => [p.userId, p]));

  const conversations = otherIds
    .map((otherId) => {
      const msgs = all.filter((m) => m.fromUserId === otherId || m.toUserId === otherId);
      const evs = eventsByPartner.get(otherId) ?? [];
      const items: ThreadItem[] = [
        ...msgs.map((m) => ({
          type: "msg" as const,
          id: `m-${m.id}`,
          at: new Date(m.createdAt).getTime(),
          fromUserId: m.fromUserId,
          subject: m.subject,
          body: m.body,
          attachmentUrl: m.attachmentUrl,
          attachmentName: m.attachmentName,
          budgetHint: m.budgetHint,
        })),
        ...evs.map((e) => ({
          type: "event" as const,
          id: `e-${e.id}`,
          at: new Date(e.createdAt).getTime(),
          kind: e.kind,
          note: e.note,
        })),
      ].sort((a, b) => a.at - b.at);
      return {
        other: partnerMap.get(otherId),
        items,
        lastAt: items[items.length - 1]?.at ?? 0,
      };
    })
    .sort((a, b) => b.lastAt - a.lastAt);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Üzenetek</h1>
        <p className="text-muted-foreground">Márkáktól érkezett üzenetek és beszélgetéseid</p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-accent/30 bg-accent/[0.06] p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#4d7c0f]" />
        <p className="text-[#3f6212]">
          A márkák keresnek meg téged — itt tudsz nekik <strong>válaszolni</strong>. Saját
          magadtól nem indíthatsz beszélgetést egy márkával; amint egy márka megír vagy
          elfogadja a pályázatodat, itt megnyílik a beszélgetés és válaszolhatsz.
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nem érkezett üzeneted. Amint egy márka megkeres, itt tudtok levelezni.
        </div>
      ) : (
        <div className="space-y-6">
          {conversations.map((c) => {
            if (!c.other) return null;
            const displayName = c.other.brandName ?? c.other.email;
            return (
              <Card key={c.other.userId}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.other.brandLogo ?? undefined} />
                      <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-base">{displayName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <MessageThread items={c.items} myId={myId} />
                  <ReplyForm toUserId={c.other.userId} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
