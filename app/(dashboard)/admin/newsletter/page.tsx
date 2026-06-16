import { desc } from "drizzle-orm";
import { Mail, Download } from "lucide-react";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Hírlevél-feliratkozók" };

const SOURCE_LABEL: Record<string, string> = {
  footer: "Lábléc",
  app_popup: "App-popup",
};

export default async function AdminNewsletterPage() {
  const rows = await db
    .select()
    .from(newsletterSubscribers)
    .orderBy(desc(newsletterSubscribers.createdAt))
    .limit(1000);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hírlevél-feliratkozók</h1>
          <p className="text-muted-foreground">
            {rows.length} feliratkozó · a láblécből és az app-popupból gyűjtve.
          </p>
        </div>
        <Button asChild variant="outline">
          <a href="/api/admin/export?type=newsletter">
            <Download className="h-4 w-4" /> CSV export
          </a>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          <Mail className="h-8 w-8" />
          Még nincs feliratkozó.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">Forrás</th>
                <th className="p-3">Feliratkozott</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-3 font-medium">
                    <a href={`mailto:${s.email}`} className="hover:text-accent">
                      {s.email}
                    </a>
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary" className="rounded-full">
                      {SOURCE_LABEL[s.source] ?? s.source}
                    </Badge>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {formatHuDate(s.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
