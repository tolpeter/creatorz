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
  FileText,
  Database,
  ShieldCheck,
  ArrowLeftRight,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DashboardMobileNav,
  type DashboardNavItem,
} from "@/components/layout/dashboard-mobile-nav";

// Logikai csoportokba rendezett menü — átláthatóbb, mint egy hosszú lista.
const navGroups = [
  {
    title: "Áttekintés",
    items: [
      { href: "/admin", label: "Áttekintés", icon: LayoutDashboard, exact: true, key: "overview" },
      { href: "/admin/analytics", label: "Analitika", icon: BarChart3, key: "analytics" },
    ],
  },
  {
    title: "Közösség",
    items: [
      { href: "/admin/users", label: "Felhasználók", icon: Users, key: "users" },
      { href: "/admin/creators", label: "Alkotók", icon: UserCheck, key: "creators" },
      { href: "/admin/brands", label: "Márkák", icon: Building2, key: "brands" },
      { href: "/admin/connections", label: "Kapcsolatok", icon: ArrowLeftRight, key: "connections" },
    ],
  },
  {
    title: "Tartalom",
    items: [
      { href: "/admin/ads", label: "Kampányok", icon: Megaphone, key: "ads" },
      { href: "/admin/applications", label: "Jelentkezők", icon: FileText, key: "applications" },
      { href: "/admin/reviews", label: "Értékelések", icon: Star, key: "reviews" },
      { href: "/admin/reports", label: "Bejelentések", icon: Flag, key: "reports" },
      { href: "/admin/blog", label: "Blog", icon: Newspaper, key: "blog" },
    ],
  },
  {
    title: "Kommunikáció",
    items: [
      { href: "/admin/inbox", label: "Üzenetek (DM)", icon: MessageSquare, key: "inbox" },
      { href: "/admin/messages", label: "Kapcsolat-üzenetek", icon: Mail, key: "messages" },
      { href: "/admin/newsletter", label: "Hírlevél", icon: Newspaper, key: "newsletter" },
      { href: "/admin/campaigns", label: "Email kampányok", icon: Send, key: "campaigns" },
    ],
  },
  {
    title: "Rendszer",
    items: [
      { href: "/admin/finance", label: "Pénzügy", icon: TrendingUp, key: "finance" },
      { href: "/admin/database", label: "Adatbázis", icon: Database, key: "database" },
      { href: "/admin/settings", label: "Beállítások", icon: Settings, key: "settings" },
    ],
  },
];

// Lapos lista a mobil-navhoz.
const navItems = navGroups.flatMap((g) => g.items);

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
      <nav className="hidden gap-1 rounded-2xl border bg-card p-2 shadow-sm md:flex md:w-64 md:flex-col md:overflow-visible md:border-white/10 md:bg-[#0A0A0A] md:p-3 md:text-white">
      <div className="hidden items-center gap-2.5 border-b border-white/10 px-2 pb-3 pt-1 md:flex">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-black shadow-[0_0_18px_rgba(163,230,53,0.35)]">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black leading-tight text-white">Admin Control</p>
          <p className="truncate text-[11px] text-white/55">Moderáció &amp; platform</p>
        </div>
      </div>
      {navGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
            {group.title}
          </p>
          {group.items.map((item) => {
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
                  "relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground shadow-[0_0_18px_rgba(163,230,53,0.25)]"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground md:text-white/70 md:hover:bg-white/10 md:hover:text-white",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{item.label}</span>
                {showBadge && (
                  <span
                    className={cn(
                      "ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                      active ? "bg-black/20 text-black" : "bg-red-500 text-white",
                    )}
                  >
                    {badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
      </nav>
    </>
  );
}
