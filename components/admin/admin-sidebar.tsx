"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Settings,
  Users,
  UserCheck,
  Building2,
  Megaphone,
  Star,
  Flag,
  TrendingUp,
  MessageSquare,
  Newspaper,
  Mail,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardMobileNav,
  type DashboardNavItem,
} from "@/components/layout/dashboard-mobile-nav";

const navItems = [
  { href: "/admin", label: "Áttekintés", icon: LayoutDashboard, exact: true, key: "overview" },
  { href: "/admin/analytics", label: "Analitika", icon: BarChart3, key: "analytics" },
  { href: "/admin/inbox", label: "Üzenetek (DM)", icon: MessageSquare, key: "inbox" },
  { href: "/admin/messages", label: "Kapcsolat-üzenetek", icon: Mail, key: "messages" },
  { href: "/admin/newsletter", label: "Hírlevél", icon: Newspaper, key: "newsletter" },
  { href: "/admin/settings", label: "Beállítások", icon: Settings, key: "settings" },
  { href: "/admin/users", label: "Felhasználók", icon: Users, key: "users" },
  { href: "/admin/creators", label: "Tartalomgyártók", icon: UserCheck, key: "creators" },
  { href: "/admin/brands", label: "Márkák", icon: Building2, key: "brands" },
  { href: "/admin/ads", label: "Hirdetések", icon: Megaphone, key: "ads" },
  { href: "/admin/blog", label: "Blog", icon: Newspaper, key: "blog" },
  { href: "/admin/reviews", label: "Értékelések", icon: Star, key: "reviews" },
  { href: "/admin/reports", label: "Bejelentések", icon: Flag, key: "reports" },
  { href: "/admin/finance", label: "Pénzügy", icon: TrendingUp, key: "finance" },
];

export function AdminSidebar({
  unreadContact = 0,
  badges = {},
}: {
  unreadContact?: number;
  badges?: Record<string, number>;
}) {
  const pathname = usePathname();
  const badgeMap: Record<string, number> = { messages: unreadContact, ...badges };
  return (
    <>
      <DashboardMobileNav
        items={navItems as readonly DashboardNavItem[]}
        unreadMessages={unreadContact}
        rootHref="/admin"
      />
      <nav className="hidden gap-2 rounded-lg border bg-card p-2 shadow-sm md:flex md:w-64 md:flex-col md:overflow-visible md:border-white/10 md:bg-[#0A0A0A] md:p-3 md:text-white">
      <div className="hidden px-3 pb-3 pt-2 md:block">
        <p className="text-xs font-semibold uppercase text-accent">
          Admin Control
        </p>
        <p className="mt-1 text-sm text-white/60">
          Moderáció, pénzügy és platform állapot.
        </p>
      </div>
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        const badgeCount = badgeMap[item.key] ?? 0;
        const showBadge = badgeCount > 0;
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
                {badgeCount}
              </span>
            )}
          </Link>
        );
      })}
      </nav>
    </>
  );
}
