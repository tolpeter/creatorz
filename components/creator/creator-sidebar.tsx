"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  FileText,
  Megaphone,
  MessageSquare,
  Star,
  CreditCard,
  Settings,
  Handshake,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardMobileNav,
  type DashboardNavItem,
} from "@/components/layout/dashboard-mobile-nav";

const navItems = [
  {
    href: "/creator",
    label: "Áttekintés",
    icon: LayoutDashboard,
    key: "overview",
  },
  {
    href: "/creator/profile",
    label: "Profil szerkesztése",
    icon: User,
    key: "profile",
  },
  {
    href: "/creator/portfolio",
    label: "Portfólió",
    icon: ImageIcon,
    key: "portfolio",
  },
  {
    href: "/creator/applications",
    label: "Pályázataim",
    icon: FileText,
    key: "applications",
  },
  {
    href: "/creator/collaborations",
    label: "Együttműködések",
    icon: Handshake,
    key: "collaborations",
  },
  { href: "/ads", label: "Hirdetések", icon: Megaphone, key: "ads" },
  {
    href: "/creator/messages",
    label: "Üzenetek",
    icon: MessageSquare,
    key: "messages",
  },
  {
    href: "/creator/reviews",
    label: "Értékelések",
    icon: Star,
    key: "reviews",
  },
  {
    href: "/creator/subscription",
    label: "Előfizetés",
    icon: CreditCard,
    key: "subscription",
  },
  {
    href: "/creator/settings",
    label: "Beállítások",
    icon: Settings,
    key: "settings",
  },
] as const;

export function CreatorSidebar({
  unreadMessages = 0,
  profileScore = 0,
  subscriptionEnabled = false,
}: {
  unreadMessages?: number;
  profileScore?: number;
  subscriptionEnabled?: boolean;
}) {
  const pathname = usePathname();

  // Előfizetés csak ha az admin bekapcsolta.
  const visibleItems = navItems.filter(
    (item) => item.key !== "subscription" || subscriptionEnabled,
  );

  return (
    <>
      {/* Mobil: lenyíló menü a vízszintesen húzható sor helyett */}
      <DashboardMobileNav
        items={visibleItems as readonly DashboardNavItem[]}
        unreadMessages={unreadMessages}
        rootHref="/creator"
      />

      {/* Desktop: klasszikus oldalsáv */}
      <nav className="hidden gap-2 rounded-lg border bg-card p-2 shadow-sm md:flex md:h-full md:w-64 md:flex-col md:gap-1 md:overflow-y-auto md:rounded-none md:border-0 md:border-r md:border-white/10 md:bg-[#0A0A0A] md:p-3 md:text-white">
      <div className="hidden px-3 pb-3 pt-2 md:block">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          Creator Stúdió
        </p>
        <p className="mt-1 text-sm text-white/60">
          Munka, profil és pályázatok egy helyen.
        </p>
      </div>
      {visibleItems.map((item) => {
        const active =
          item.href === "/creator"
            ? pathname === "/creator"
            : pathname.startsWith(item.href);
        const Icon = item.icon;
        const showBadge = item.key === "messages" && unreadMessages > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground md:text-white/70 md:hover:bg-white/10 md:hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadMessages}
              </span>
            )}
          </Link>
        );
      })}

      {/* Profil kitöltöttség widget (csak desktopon, az oldalsáv alján) */}
      <div className="mt-3 hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 md:mt-auto md:block">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
          Profil kitöltöttség
        </p>
        <p className="mt-1 text-2xl font-black text-accent">{profileScore}%</p>
        <p className="text-xs font-medium text-white/70">
          {profileScore >= 100 ? "Kész!" : "Majdnem kész!"}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${profileScore}%` }}
          />
        </div>
        {profileScore < 100 && (
          <p className="mt-2 text-[11px] leading-4 text-white/50">
            Töltsd ki az összes mezőt a jobb láthatóságért!
          </p>
        )}
      </div>
      </nav>
    </>
  );
}
