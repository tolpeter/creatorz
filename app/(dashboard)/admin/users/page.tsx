import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { ExportButton } from "@/components/admin/export-button";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Users } from "lucide-react";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Felhasználók" };

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const role = sp.role ?? "";

  const conditions: SQL[] = [];
  if (q) conditions.push(ilike(users.email, `%${q}%`));
  if (role === "creator" || role === "brand" || role === "admin")
    conditions.push(eq(users.role, role));
  if (role === "suspended") conditions.push(eq(users.suspended, true));

  const baseWhere = conditions.length ? and(...conditions) : undefined;
  const LIST_LIMIT = 500;

  const rows = await db
    .select()
    .from(users)
    .where(baseWhere)
    .orderBy(desc(users.createdAt))
    .limit(LIST_LIMIT);

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(users)
    .where(baseWhere);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Felhasználók"
        icon={Users}
        description={`${total} találat${total > rows.length ? ` · első ${rows.length} látható` : ""}`}
        action={<ExportButton type="users" />}
      />

      <AdminSearch
        q={q}
        placeholder="Keresés email alapján…"
        basePath="/admin/users"
        filterParam="role"
        activeFilter={role}
        filters={[
          { label: "Mind", value: "" },
          { label: "Tartalomgyártó", value: "creator" },
          { label: "Márka", value: "brand" },
          { label: "Admin", value: "admin" },
          { label: "Felfüggesztett", value: "suspended" },
        ]}
      />

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
                  <UserRowActions
                    userId={u.id}
                    role={u.role}
                    suspended={u.suspended}
                    canSeeViewers={u.canSeeViewers}
                    label={u.email}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
