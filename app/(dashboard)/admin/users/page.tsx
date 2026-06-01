import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Felhasználók" };

export default async function AdminUsersPage() {
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Felhasználók</h1>
        <p className="text-muted-foreground">{rows.length} felhasználó</p>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Állapot</th>
              <th className="p-3">Regisztrált</th>
              <th className="p-3">Utolsó belépés</th>
              <th className="p-3">Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                <td className="p-3">{u.email}</td>
                <td className="p-3">
                  {u.suspended ? (
                    <Badge className="bg-destructive/15 text-destructive">Felfüggesztve</Badge>
                  ) : (
                    <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">Aktív</Badge>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">{formatHuDate(u.createdAt)}</td>
                <td className="p-3 whitespace-nowrap">
                  {u.lastLoginAt ? formatHuDate(u.lastLoginAt) : "—"}
                </td>
                <td className="p-3">
                  <UserRowActions userId={u.id} role={u.role} suspended={u.suspended} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
