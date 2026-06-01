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
  { href: "/brand", label: "Áttekintés", icon: LayoutDashboard, exact: true },
  { href: "/creators", label: "Tartalomgyártók böngészése", icon: Search },
  { href: "/brand/saved", label: "Mentett tartalomgyártók", icon: Heart },
  { href: "/brand/ads", label: "Hirdetéseim", icon: Megaphone },
  { href: "/brand/messages", label: "Üzenetek", icon: MessageSquare },
  { href: "/brand/profile", label: "Cég profil", icon: Building2 },
  { href: "/brand/settings", label: "Beállítások", icon: Settings },
];

export function BrandSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-60 md:flex-col md:overflow-visible">
      {navItems.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
