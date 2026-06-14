import { redirect } from "next/navigation";
import { and, eq, or, asc, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, users, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyForm } from "@/components/shared/reply-form";
import { MessageAttachment } from "@/components/shared/message-attachment";
import { formatHuf } from "@/lib/utils/format";
import { relativeTime } from "@/lib/utils/relative-time";
import { cn } from "@/lib/utils";

export const metadata = { title: "Üzenetek" };

export default async function BrandMessagesPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");
  const myId = brand.appUserId;

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

  const otherIds = Array.from(
    new Set(all.map((m) => (m.fromUserId === myId ? m.toUserId : m.fromUserId)))
  );

  const partners = otherIds.length
    ? await db
        .select({
          userId: users.id,
          email: users.email,
          creatorName: creatorProfiles.displayName,
          creatorAvatar: creatorProfiles.avatarUrl,
        })
        .from(users)
        .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
        .where(sql`${users.id} in ${otherIds}`)
    : [];

  const partnerMap = new Map(partners.map((p) => [p.userId, p]));

  const conversations = otherIds.map((otherId) => ({
    other: partnerMap.get(otherId),
    msgs: all.filter((m) => m.fromUserId === otherId || m.toUserId === otherId),
  }));

  conversations.sort((a, b) => {
    const aLast = a.msgs[a.msgs.length - 1]?.createdAt ?? new Date(0);
    const bLast = b.msgs[b.msgs.length - 1]?.createdAt ?? new Date(0);
    return bLast.getTime() - aLast.getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Üzenetek</h1>
        <p className="text-muted-foreground">
          Beszélgetéseid a tartalomgyártókkal
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nem küldtél üzenetet. Egy tartalomgyártó profilján a „Üzenetet
          küldök" gombbal indíthatsz beszélgetést.
        </div>
      ) : (
        <div className="space-y-6">
          {conversations.map((c) => {
            if (!c.other) return null;
            const displayName = c.other.creatorName ?? c.other.email;
            return (
              <Card key={c.other.userId}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={c.other.creatorAvatar ?? undefined} />
                      <AvatarFallback>
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-base">{displayName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {c.msgs.map((m) => {
                      const mine = m.fromUserId === myId;
                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "flex flex-col gap-1",
                            mine ? "items-end" : "items-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                              mine
                                ? "rounded-br-sm bg-accent text-accent-foreground"
                                : "rounded-bl-sm bg-muted"
                            )}
                          >
                            {m.subject && (
                              <p className="mb-1 text-xs font-semibold opacity-80">
                                {m.subject}
                              </p>
                            )}
                            {m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
                            {m.attachmentUrl && (
                              <MessageAttachment
                                url={m.attachmentUrl}
                                name={m.attachmentName}
                                mine={mine}
                              />
                            )}
                            {m.budgetHint != null && (
                              <p className="mt-1 text-xs opacity-80">
                                Becsült büdzsé: {formatHuf(m.budgetHint)}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {relativeTime(m.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
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
