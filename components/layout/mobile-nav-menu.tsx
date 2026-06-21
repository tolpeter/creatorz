"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

type NavLink = { label: string; href: string };
type NavCta = { label: string; href: string; variant?: "primary" | "secondary" };

/**
 * Mobil hamburger-menü a navigációhoz. A trigger csak a megadott breakpoint
 * alatt látszik (showClass), a lenyíló panel a sticky/relatív fejléchez igazodik.
 */
export function MobileNavMenu({
  links,
  ctas = [],
  theme = "light",
  showClass = "lg:hidden",
}: {
  links: NavLink[];
  ctas?: NavCta[];
  theme?: "light" | "dark";
  showClass?: string;
}) {
  const [open, setOpen] = useState(false);

  const dark = theme === "dark";
  // Feltűnőbb (accent) hamburger, hogy mobilon észrevehető legyen a menü.
  const triggerCls = dark
    ? "border-accent/40 bg-accent/15 text-accent hover:bg-accent hover:text-black"
    : "border-accent/40 bg-accent/10 text-[#4d7c0f] hover:bg-accent hover:text-black";
  const panelCls = dark
    ? "border-white/10 bg-[#0a0a0a]/95 text-white"
    : "border-black/10 bg-white text-foreground";
  const itemCls = dark
    ? "text-white/80 hover:bg-white/10 hover:text-accent"
    : "text-foreground/80 hover:bg-muted hover:text-foreground";
  const ctaSecondaryCls = dark
    ? "border-white/15 bg-white/5 text-white hover:bg-white/10"
    : "border-black/10 bg-white text-foreground hover:bg-muted";

  return (
    <div className={showClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Menü"
        aria-expanded={open}
        className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${triggerCls}`}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          {/* háttér-kattintásra zár */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            className={`absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-2xl border-t shadow-2xl backdrop-blur-xl ${panelCls}`}
          >
            <nav className="flex flex-col p-3 sm:p-4">
              {links.map((l) =>
                l.href === "/status" ? (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`my-1 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
                      dark
                        ? "border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-black"
                        : "border border-accent/40 bg-accent/10 text-[#4d7c0f] hover:bg-accent hover:text-black"
                    }`}
                  >
                    <span className="relative flex h-2 w-2 items-center justify-center">
                      <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-accent opacity-70" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
                    </span>
                    {l.label}
                  </Link>
                ) : (
                  <Link
                    key={l.label}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-medium transition-colors ${itemCls}`}
                  >
                    {l.label}
                  </Link>
                ),
              )}
              {ctas.length > 0 ? (
                <div className="mt-2 grid gap-2 border-t border-current/10 pt-2">
                  {ctas.map((cta) => (
                    <Link
                      key={cta.label}
                      href={cta.href}
                      onClick={() => setOpen(false)}
                      className={
                        cta.variant === "secondary"
                          ? `rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-colors ${ctaSecondaryCls}`
                          : "rounded-xl bg-accent px-4 py-3 text-center text-sm font-bold text-black transition-colors hover:bg-white"
                      }
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
