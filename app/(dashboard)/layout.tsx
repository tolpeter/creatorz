import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, messages, brandProfiles, creatorProfiles } from "@/lib/db/schema";
import { LogoutButton } from "@/components/shared/logout-button";
import { ProfilePhotoPrompt } from "@/components/shared/profile-photo-prompt";

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
  // Fontos: a redirect() a try-on KÍVÜL legyen (belül elnyelnénk a jelét).
  // Átmeneti DB-akadásnál NE dobjuk ki a usert — inkább beengedjük.
  let needsEmailVerification = false;
  if (current.dbUser) {
    try {
      const [row] = await db
        .select({ emailVerified: users.emailVerified })
        .from(users)
        .where(eq(users.id, current.dbUser.id))
        .limit(1);
      if (row && !row.emailVerified) needsEmailVerification = true;
    } catch {
      // átmeneti DB-hiba: ne blokkoljuk a belépést
    }
  }
  if (needsEmailVerification) {
    redirect("/verify-email");
  }

  // A fejléc adatai (értesítések + olvasatlan üzenetek) best-effort: egy
  // átmeneti DB-akadás (statement timeout) ne döntse le az egész dashboardot.
  let notifications: Awaited<ReturnType<typeof getNotifications>>["items"] = [];
  let unread = 0;
  try {
    const res = await getNotifications();
    notifications = res.items;
    unread = res.unread;
  } catch {
    // best-effort: üres értesítéslista
  }

  let unreadMessages = 0;
  const role = current.dbUser?.role ?? "creator";
  const inboxHref = INBOX_HREF[role] ?? "/dashboard";

  // Profilkép-emlékeztető: ha nincs avatar/logó, felugró ablakban kérjük —
  // de munkamenetenként csak egyszer (a pop-up beállít egy session cookie-t).
  const promptSeen = (await cookies()).get("creatorz_photo_prompt")?.value === "1";
  let needsPhoto = false;
  if (current.dbUser && !promptSeen) {
    try {
      if (role === "brand") {
        const [b] = await db
          .select({ logoUrl: brandProfiles.logoUrl })
          .from(brandProfiles)
          .where(eq(brandProfiles.userId, current.dbUser.id))
          .limit(1);
        needsPhoto = b ? !b.logoUrl : false;
      } else if (role === "creator") {
        const [c] = await db
          .select({ avatarUrl: creatorProfiles.avatarUrl })
          .from(creatorProfiles)
          .where(eq(creatorProfiles.userId, current.dbUser.id))
          .limit(1);
        needsPhoto = c ? !c.avatarUrl : false;
      }
    } catch {
      // best-effort: ne blokkolja a dashboardot
    }
  }
  if (current.dbUser) {
    try {
      const [mc] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(eq(messages.toUserId, current.dbUser.id), eq(messages.read, false)),
        );
      unreadMessages = mc?.n ?? 0;
    } catch {
      // best-effort: 0 olvasatlan
    }
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
      {needsPhoto && (role === "brand" || role === "creator") ? (
        <ProfilePhotoPrompt role={role === "brand" ? "brand" : "creator"} />
      ) : null}
    </div>
  );
}
