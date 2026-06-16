"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { NewsletterForm } from "@/components/shared/newsletter-form";

const COOKIE = "creatorz_app_popup_dismissed";

function isDismissed() {
  if (typeof document === "undefined") return true;
  return document.cookie.split("; ").some((c) => c.startsWith(`${COOKIE}=1`));
}

/**
 * "Hamarosan: Creatorz mobil app" promó popup a főoldalon. A kreatívot
 * (public/images/mobilapp.webp) jeleníti meg, alul hírlevél-feliratkozással.
 * Admin-ról kapcsolható (mobile_app_popup_enabled). A bezárást cookie jegyzi
 * (7 nap) — nem böngésző-storage.
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
        className="animate-slide-up relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-[#0A0A0A] text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label="Bezárás"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
        >
          <X className="h-4 w-4" />
        </button>

        {/* A kreatív (teljes designolt kép) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/mobilapp.webp"
          alt="Hamarosan: Creatorz mobil app — Android és iOS"
          className="block w-full"
        />

        {/* Hírlevél-feliratkozás */}
        <div className="border-t border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <p className="mb-2 text-sm font-semibold">
            Értesítselek, amikor megjelenik?
          </p>
          <NewsletterForm
            source="app_popup"
            variant="dark"
            buttonLabel="Értesítsetek"
          />
          <p className="mt-2 text-[11px] text-white/40">
            Bármikor leiratkozhatsz. Csak az app indulásáról és fontos hírekről
            írunk.
          </p>
        </div>
      </div>
    </div>
  );
}
