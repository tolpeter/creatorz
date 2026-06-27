import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  contactMessages,
  ads,
  reports,
  messages,
  adApplications,
  creatorProfiles,
} from "@/lib/db/schema";
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

  const [unreadRows, pendingAdRows, openReportRows, unreadDmRows, pendingAppRows, incompleteRows] =
    await Promise.all([
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
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false))),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(adApplications)
        .where(eq(adApplications.status, "pending")),
      db
        .select({ n: sql<number>`count(*)::int` })
        .from(creatorProfiles)
        .where(eq(creatorProfiles.onboardingCompleted, false)),
    ]);
  const unreadContact = unreadRows[0]?.n ?? 0;
  const pendingAds = pendingAdRows[0]?.n ?? 0;
  const openReports = openReportRows[0]?.n ?? 0;
  const unreadDms = unreadDmRows[0]?.n ?? 0;
  const pendingApps = pendingAppRows[0]?.n ?? 0;
  const incompleteCreators = incompleteRows[0]?.n ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row lg:gap-8 lg:py-8">
      <NewMessageToast count={unreadContact} pendingAds={pendingAds} openReports={openReports} />
      <aside className="sticky top-[60px] z-30 pb-2 md:top-20 md:max-h-[calc(100vh-6rem)] md:self-start md:overflow-y-auto md:pb-0 md:pr-1">
        <AdminSidebar
          unreadContact={unreadContact}
          badges={{
            ads: pendingAds,
            reports: openReports,
            inbox: unreadDms,
            applications: pendingApps,
            creators: incompleteCreators,
          }}
        />
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
