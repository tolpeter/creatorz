"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  key: string;
};

/**
 * Mobil vezérlőpult-navigáció: oldalra húzható sor HELYETT rendes lenyíló
 * menü. A gomb mutatja az aktuális oldal ikonját + nevét, kattintásra lenyílik
 * a teljes lista (szintén ikon + név). Csak mobilon látszik (md:hidden).
 */
export function DashboardMobileNav({
  items,
  unreadMessages = 0,
  rootHref,
}: {
  items: readonly DashboardNavItem[];
  unreadMessages?: number;
  /** A „pontos egyezés" útvonal (pl. /creator), hogy ne legyen mindig aktív. */
  rootHref?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === rootHref ? pathname === rootHref : pathname.startsWith(href);

  const current = items.find((i) => isActive(i.href)) ?? items[0];
  const CurrentIcon = current.icon;

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white/75 px-3.5 py-3 text-sm font-semibold shadow-lg ring-1 ring-black/5 backdrop-blur-xl"
        aria-expanded={open}
      >
        <CurrentIcon className="h-4 w-4 text-accent" />
        <span className="flex-1 text-left">{current.label}</span>
        {unreadMessages > 0 && current.key !== "messages" && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
            {unreadMessages}
          </span>
        )}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          {/* Háttér-kattintás a bezáráshoz */}
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-black/10 bg-white/90 p-1.5 shadow-2xl backdrop-blur-xl">
            {items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.key === "messages" && unreadMessages > 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                      {unreadMessages}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
