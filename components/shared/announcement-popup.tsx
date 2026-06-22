"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Rocket, Smartphone, Sparkles, X } from "lucide-react";
import { SocialTile } from "@/components/creator/platform-icon";

/**
 * Bejelentkezéskor egyszer felugró „Min dolgozunk a háttérben?" pop-up.
 * Munkamenet-cookie tartja számon (NEM localStorage); kijelentkezéskor törlődik,
 * így minden új belépésnél megjelenik. A /status oldalra irányít.
 */
export function AnnouncementPopup() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    document.cookie = "cz_devnews=1; path=/; samesite=lax";
  }, []);

  if (!open) return null;

  const items = [
    {
      tile: <SocialTile platform="facebook" className="h-9 w-9" />,
      title: "Hivatalos Facebook összekötés",
      note: "Várunk a Meta jóváhagyására",
    },
    {
      tile: <SocialTile platform="tiktok" className="h-9 w-9" />,
      title: "Hivatalos TikTok összekötés",
      note: "Várunk a TikTok jóváhagyására",
    },
    {
      tile: (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#4d7c0f]">
          <Smartphone className="h-5 w-5" />
        </span>
      ),
      title: "Mobil applikáció",
      note: "Fejlesztés alatt — kb. 70%",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border bg-card shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        {/* Sötét, márka-stílusú fejléc */}
        <div className="relative overflow-hidden bg-[#0b0d0a] px-6 pb-6 pt-7 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(163,230,53,0.18),transparent_40%)]"
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Bezárás"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="relative inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Hamarosan
          </span>
          <h2 className="relative mt-3 text-2xl font-black">Min dolgozunk a háttérben?</h2>
          <p className="relative mt-1.5 text-sm text-white/70">
            Folyamatosan fejlesztjük a Creatorzot. Íme, mi érkezik hamarosan:
          </p>
        </div>

        {/* Tartalom */}
        <div className="space-y-3 p-6">
          {items.map((it) => (
            <div key={it.title} className="flex items-center gap-3 rounded-2xl border bg-[#f6f7f2] p-3">
              {it.tile}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight">{it.title}</p>
                <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  <Clock className="h-3 w-3" />
                  {it.note}
                </p>
              </div>
            </div>
          ))}

          <p className="pt-1 text-sm text-muted-foreground">
            Az <strong className="text-foreground">Aktuális fejlesztések</strong> oldalon mindig
            eléred az újdonságokat és azt, hogy épp min dolgozunk.
          </p>

          <Link
            href="/status"
            onClick={() => setOpen(false)}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-black transition-colors hover:bg-[#0b0d0a] hover:text-white"
          >
            <Rocket className="h-4 w-4" />
            Fejlesztések megtekintése
            <ArrowRight className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mx-auto block text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Most nem
          </button>
        </div>
      </div>
    </div>
  );
}
