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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/creator", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/creator/profile", label: "Profil szerkesztése", icon: User },
  { href: "/creator/portfolio", label: "Portfolio", icon: ImageIcon },
  { href: "/creator/applications", label: "Pályázataim", icon: FileText },
  { href: "/ads", label: "Hirdetések", icon: Megaphone },
  { href: "/creator/messages", label: "Üzenetek", icon: MessageSquare },
  { href: "/creator/reviews", label: "Értékelések", icon: Star },
  { href: "/creator/subscription", label: "Előfizetés", icon: CreditCard },
  { href: "/creator/settings", label: "Beállítások", icon: Settings },
];

export function CreatorSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-60 md:flex-col md:overflow-visible">
      {navItems.map((item) => {
        const active =
          item.href === "/creator"
            ? pathname === "/creator"
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
