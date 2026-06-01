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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Áttekintés", icon: LayoutDashboard, exact: true },
  { href: "/admin/settings", label: "Beállítások", icon: Settings },
  { href: "/admin/users", label: "Felhasználók", icon: Users },
  { href: "/admin/creators", label: "Creatorok", icon: UserCheck },
  { href: "/admin/brands", label: "Márkák", icon: Building2 },
  { href: "/admin/ads", label: "Hirdetések", icon: Megaphone },
  { href: "/admin/reviews", label: "Értékelések", icon: Star },
  { href: "/admin/reports", label: "Bejelentések", icon: Flag },
  { href: "/admin/finance", label: "Pénzügy", icon: TrendingUp },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:w-56 md:flex-col md:overflow-visible">
      {navItems.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
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
