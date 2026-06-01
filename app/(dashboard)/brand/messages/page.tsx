import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { messages, users, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHuDate, formatHuf } from "@/lib/utils/format";

export const metadata = { title: "Üzenetek" };

export default async function BrandMessagesPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const rows = await db
    .select({
      id: messages.id,
      subject: messages.subject,
      body: messages.body,
      budgetHint: messages.budgetHint,
      createdAt: messages.createdAt,
      toName: creatorProfiles.displayName,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.toUserId))
    .leftJoin(creatorProfiles, eq(creatorProfiles.userId, users.id))
    .where(eq(messages.fromUserId, brand.appUserId))
    .orderBy(desc(messages.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Üzenetek</h1>
        <p className="text-muted-foreground">Elküldött üzeneteid</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nem küldtél üzenetet. Egy tartalomgyártó profilján a „Üzenetet küldök"
          gombbal indíthatsz beszélgetést.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <Card key={m.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Címzett: {m.toName ?? "—"}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {formatHuDate(m.createdAt)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {m.subject && <p className="font-medium">{m.subject}</p>}
                <p className="whitespace-pre-wrap text-muted-foreground">{m.body}</p>
                {m.budgetHint != null && (
                  <p className="text-xs">Büdzsé: {formatHuf(m.budgetHint)}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
