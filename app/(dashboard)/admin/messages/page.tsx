import { and, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { Mail } from "lucide-react";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/admin-search";
import { ContactMessageActions } from "@/components/admin/contact-message-actions";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Üzenetek" };

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";

  const conditions: SQL[] = [];
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(contactMessages.subject, like),
        ilike(contactMessages.email, like),
        ilike(contactMessages.name, like),
        ilike(contactMessages.message, like),
      )!,
    );
  }
  if (status === "unread") conditions.push(eq(contactMessages.read, false));
  if (status === "read") conditions.push(eq(contactMessages.read, true));

  const rows = await db
    .select()
    .from(contactMessages)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(contactMessages.createdAt))
    .limit(200);

  const unread = rows.filter((r) => !r.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Üzenetek</h1>
        <p className="text-muted-foreground">
          {rows.length} üzenet · {unread} olvasatlan
        </p>
      </div>

      <AdminSearch
        q={q}
        placeholder="Keresés tárgy, email, név vagy szöveg alapján…"
        basePath="/admin/messages"
        filterParam="status"
        activeFilter={status}
        filters={[
          { label: "Mind", value: "" },
          { label: "Olvasatlan", value: "unread" },
          { label: "Olvasott", value: "read" },
        ]}
      />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <Mail className="h-8 w-8" />
          Nincs a keresésnek megfelelő üzenet.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div
              key={m.id}
              className={
                "rounded-2xl border p-4 transition-colors " +
                (m.read ? "bg-white" : "border-accent/40 bg-accent/[0.06]")
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {!m.read && (
                      <Badge className="bg-accent text-black hover:bg-accent">
                        Új
                      </Badge>
                    )}
                    <span className="font-bold">{m.subject}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {m.name ? `${m.name} · ` : ""}
                    <a
                      href={`mailto:${m.email}`}
                      className="text-accent underline"
                    >
                      {m.email}
                    </a>{" "}
                    · {formatHuDate(m.createdAt)}
                  </p>
                </div>
                <ContactMessageActions id={m.id} read={m.read} />
              </div>
              <p className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/50 p-3 text-sm leading-6">
                {m.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
