import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, messages } from "@/lib/db/schema";
import { LogoutButton } from "@/components/shared/logout-button";

// A dashboard minden oldala auth-mögötti, élő adat — sosem prerendereljük build-időben.
export const dynamic = "force-dynamic";
import { Logo } from "@/components/layout/logo";
import { NotificationBell } from "@/components/shared/notification-bell";
import { getNotifications } from "@/app/actions/notifications";

const INBOX_HREF: Record<string, string> = {
  creator: "/creator/messages",
  brand: "/brand/messages",
  admin: "/admin/inbox",
};

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

  // Olvasatlan közvetlen üzenetek (a fejléc levél-ikonjához).
  let unreadMessages = 0;
  const role = current.dbUser?.role ?? "creator";
  const inboxHref = INBOX_HREF[role] ?? "/dashboard";
  if (current.dbUser) {
    const [mc] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false)),
      );
    unreadMessages = mc?.n ?? 0;
  }

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
          <Link
            href={inboxHref}
            aria-label="Üzenetek"
            className="relative flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            <Mail className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-black">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Link>
          <NotificationBell initialItems={notifications} initialUnread={unread} />
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
