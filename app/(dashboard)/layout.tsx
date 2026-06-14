import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { LogoutButton } from "@/components/shared/logout-button";

// A dashboard minden oldala auth-mögötti, élő adat — sosem prerendereljük build-időben.
export const dynamic = "force-dynamic";
import { Logo } from "@/components/layout/logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getNotifications } from "@/app/actions/notifications";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current) redirect("/login");
  if (current.dbUser?.suspended) redirect("/login?suspended=1");

  // Email-verifikáció: ha még nincs megerősítve az emailcím, ne engedjük be
  // a dashboardra. A /verify-email és az /onboarding/* nem itt szerepel
  // (azok más layoutban vannak), tehát ezeket nem érinti.
  if (current.dbUser) {
    const [row] = await db
      .select({ emailVerified: users.emailVerified })
      .from(users)
      .where(eq(users.id, current.dbUser.id))
      .limit(1);
    if (row && !row.emailVerified) {
      redirect("/verify-email");
    }
  }

  const { items: notifications, unread } = await getNotifications();

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f6f2]">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0A0A0A]/95 px-4 text-white shadow-sm backdrop-blur sm:px-6">
        <Link href="/">
          <Logo variant="light" className="text-lg" />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-white/60 sm:inline">
            {current.authUser.email}
          </span>
          <NotificationBell initialItems={notifications} initialUnread={unread} />
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
