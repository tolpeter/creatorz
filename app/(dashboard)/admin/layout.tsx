import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { contactMessages, ads, reports } from "@/lib/db/schema";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { NewMessageToast } from "@/components/admin/new-message-toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  if (current.dbUser.role !== "admin") {
    redirect(current.dbUser.role === "creator" ? "/creator" : "/brand");
  }

  const [unreadRows, pendingAdRows, openReportRows] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(contactMessages)
      .where(eq(contactMessages.read, false)),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(ads)
      .where(eq(ads.status, "pending")),
    db
      .select({ n: sql<number>`count(*)::int` })
      .from(reports)
      .where(eq(reports.status, "open")),
  ]);
  const unreadContact = unreadRows[0]?.n ?? 0;
  const pendingAds = pendingAdRows[0]?.n ?? 0;
  const openReports = openReportRows[0]?.n ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:gap-8 lg:py-8">
      <NewMessageToast count={unreadContact} pendingAds={pendingAds} openReports={openReports} />
      <aside className="sticky top-[60px] z-30 pb-2 md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:pb-0 md:pr-1">
        <AdminSidebar
          unreadContact={unreadContact}
          badges={{ ads: pendingAds, reports: openReports }}
        />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
