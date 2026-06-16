"use client";

import { useEffect, useState } from "react";
import { Apple, Smartphone, Sparkles, X } from "lucide-react";
import { NewsletterForm } from "@/components/shared/newsletter-form";

const COOKIE = "creatorz_app_popup_dismissed";

function isDismissed() {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=1`));
}

/**
 * "Hamarosan: Creatorz mobil app" promó popup a főoldalon. Admin-ról
 * kapcsolható (mobile_app_popup_enabled). A bezárást cookie-ban jegyzi
 * (7 napig nem jelenik meg újra) — nem böngésző-storage.
 * Alul hírlevél-feliratkozás: aki értesülni akar az app érkezéséről.
 */
export function MobileAppPopup({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [showImg, setShowImg] = useState(true);

  useEffect(() => {
    if (!enabled || isDismissed()) return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, [enabled]);

  function close() {
    setOpen(false);
    document.cookie = `${COOKIE}=1; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
  }

  if (!enabled || !open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={close}
    >
      <div
        className="animate-slide-up relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Lime glow háttér */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
        />

        <button
          type="button"
          onClick={close}
          aria-label="Bezárás"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Hamarosan
            </span>
            <h2 className="mt-3 text-3xl font-black leading-[1.05]">
              Jön a <span className="text-accent">Creatorz</span> mobil app
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/75">
              A teljes platform a zsebedben — böngéssz, pályázz és üzenj
              bárhonnan. Hamarosan elérhető Androidra és iOS-re.
            </p>
          </div>

          {/* Telefon-mockup kép (ha elérhető) */}
          {showImg && (
            <div className="relative mx-auto hidden w-40 sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/app-mockup.png"
                alt="Creatorz mobil app"
                onError={() => setShowImg(false)}
                className="w-full object-contain drop-shadow-[0_20px_40px_rgba(163,230,53,0.25)]"
              />
            </div>
          )}
        </div>

        {/* Store-jelvények */}
        <div className="relative grid grid-cols-2 gap-3 px-6 sm:px-7">
          <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3">
            <Smartphone className="h-6 w-6 shrink-0 text-accent" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-accent">
                Hamarosan
              </p>
              <p className="text-sm font-bold">Google Play</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.06] px-4 py-3">
            <Apple className="h-6 w-6 shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] uppercase tracking-wide text-accent">
                Hamarosan
              </p>
              <p className="text-sm font-bold">App Store</p>
            </div>
          </div>
        </div>

        {/* Hírlevél-feliratkozás */}
        <div className="relative border-t border-white/10 bg-white/[0.03] p-6 sm:p-7">
          <p className="mb-2 text-sm font-semibold">
            Értesítselek, amikor megjelenik?
          </p>
          <NewsletterForm
            source="app_popup"
            variant="dark"
            buttonLabel="Értesítsetek"
          />
          <p className="mt-2 text-[11px] text-white/40">
            Bármikor leiratkozhatsz. Csak az app indulásáról és fontos
            hírekről írunk.
          </p>
        </div>
      </div>
    </div>
  );
}
