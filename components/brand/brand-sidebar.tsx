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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/brand", label: "Áttekintés", icon: LayoutDashboard, exact: true, key: "overview" },
  { href: "/creators", label: "Tartalomgyártók böngészése", icon: Search, key: "browse" },
  { href: "/brand/saved", label: "Mentett tartalomgyártók", icon: Heart, key: "saved" },
  { href: "/brand/ads", label: "Hirdetéseim", icon: Megaphone, key: "ads" },
  { href: "/brand/messages", label: "Üzenetek", icon: MessageSquare, key: "messages" },
  { href: "/brand/profile", label: "Cég profil", icon: Building2, key: "profile" },
  { href: "/brand/settings", label: "Beállítások", icon: Settings, key: "settings" },
] as const;

export function BrandSidebar({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-60 md:flex-col md:overflow-visible">
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
              "relative flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
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
  );
}
