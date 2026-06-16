"use client";

import { useEffect, useState } from "react";
import { Apple, Smartphone, Sparkles, X } from "lucide-react";

const COOKIE = "creatorz_app_popup_dismissed";

function isDismissed() {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=1`));
}

/**
 * "Hamarosan: Creatorz mobil app" promó popup a főoldalon. Admin-ról
 * kapcsolható (mobile_app_popup_enabled). A bezárást cookie-ban jegyzi
 * (7 napig nem jelenik meg újra) — nem böngésző-storage.
 */
export function MobileAppPopup({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled || isDismissed()) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [enabled]);

  function close() {
    setOpen(false);
    // 7 napig ne jelenjen meg újra.
    document.cookie = `${COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
  }

  if (!enabled || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="animate-slide-up relative w-full max-w-md overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Felső lime-os sáv */}
        <div className="relative overflow-hidden bg-[#0A0A0A] px-6 pb-8 pt-7 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/25 blur-3xl"
          />
          <button
            type="button"
            onClick={close}
            aria-label="Bezárás"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Hamarosan
          </span>
          <h2 className="mt-3 text-2xl font-black leading-tight">
            Jön a <span className="text-accent">Creatorz</span> mobil app
          </h2>
          <p className="mt-2 text-sm text-white/75">
            A teljes platform a zsebedben — böngéssz, pályázz és üzenj bárhonnan.
            Hamarosan elérhető Androidra és iOS-re.
          </p>
        </div>

        {/* Store-jelvények (coming soon) */}
        <div className="grid grid-cols-2 gap-3 p-6">
          <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f6f7f2] px-4 py-3">
            <Smartphone className="h-6 w-6 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Hamarosan
              </p>
              <p className="text-sm font-bold">Google Play</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f6f7f2] px-4 py-3">
            <Apple className="h-6 w-6 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Hamarosan
              </p>
              <p className="text-sm font-bold">App Store</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            type="button"
            onClick={close}
            className="h-11 w-full rounded-xl bg-[#0A0A0A] text-sm font-semibold text-white transition hover:bg-accent hover:text-black"
          >
            Értem, várom!
          </button>
        </div>
      </div>
    </div>
  );
}
