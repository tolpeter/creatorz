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
  { href: "/creator", label: "Áttekintés", icon: LayoutDashboard, key: "overview" },
  { href: "/creator/profile", label: "Profil szerkesztése", icon: User, key: "profile" },
  { href: "/creator/portfolio", label: "Portfolio", icon: ImageIcon, key: "portfolio" },
  { href: "/creator/applications", label: "Pályázataim", icon: FileText, key: "applications" },
  { href: "/ads", label: "Hirdetések", icon: Megaphone, key: "ads" },
  { href: "/creator/messages", label: "Üzenetek", icon: MessageSquare, key: "messages" },
  { href: "/creator/reviews", label: "Értékelések", icon: Star, key: "reviews" },
  { href: "/creator/subscription", label: "Előfizetés", icon: CreditCard, key: "subscription" },
  { href: "/creator/settings", label: "Beállítások", icon: Settings, key: "settings" },
] as const;

export function CreatorSidebar({ unreadMessages = 0 }: { unreadMessages?: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:w-60 md:flex-col md:overflow-visible">
      {navItems.map((item) => {
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
