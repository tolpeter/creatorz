"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Search,
  Heart,
  Megaphone,
  MessageSquare,
  Building2,
  Settings,
  Handshake,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardMobileNav,
  type DashboardNavItem,
} from "@/components/layout/dashboard-mobile-nav";

const navItems = [
  {
    href: "/brand",
    label: "Áttekintés",
    icon: LayoutDashboard,
    exact: true,
    key: "overview",
  },
  {
    href: "/creators",
    label: "Tartalomgyártók böngészése",
    icon: Search,
    key: "browse",
  },
  {
    href: "/brand/saved",
    label: "Mentett tartalomgyártók",
    icon: Heart,
    key: "saved",
  },
  { href: "/brand/ads", label: "Hirdetéseim", icon: Megaphone, key: "ads" },
  {
    href: "/brand/collaborations",
    label: "Együttműködések",
    icon: Handshake,
    key: "collaborations",
  },
  {
    href: "/brand/messages",
    label: "Üzenetek",
    icon: MessageSquare,
    key: "messages",
  },
  { href: "/brand/reviews", label: "Értékelések", icon: Star, key: "reviews" },
  {
    href: "/brand/profile",
    label: "Cég profil",
    icon: Building2,
    key: "profile",
  },
  {
    href: "/brand/settings",
    label: "Beállítások",
    icon: Settings,
    key: "settings",
  },
] as const;

export function BrandSidebar({
  unreadMessages = 0,
}: {
  unreadMessages?: number;
}) {
  const pathname = usePathname();

  return (
    <>
      <DashboardMobileNav
        items={navItems as readonly DashboardNavItem[]}
        unreadMessages={unreadMessages}
        rootHref="/brand"
      />
      <nav className="hidden gap-2 rounded-lg border bg-card p-2 shadow-sm md:flex md:w-64 md:flex-col md:overflow-visible md:border-white/10 md:bg-[#0A0A0A] md:p-3 md:text-white">
      <div className="hidden px-3 pb-3 pt-2 md:block">
        <p className="text-xs font-semibold uppercase text-accent">Brand Hub</p>
        <p className="mt-1 text-sm text-white/60">
          Kampányok, mentések és üzenetek.
        </p>
      </div>
      {navItems.map((item) => {
        const exact = "exact" in item ? item.exact : false;
        const active = exact
          ? pathname === item.href
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
      </nav>
    </>
  );
}
