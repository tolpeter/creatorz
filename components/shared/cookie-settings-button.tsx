"use client";

import { openCookieSettings } from "@/lib/analytics/consent";

/** Újranyitja a cookie-beállítások panelt (pl. footerben). */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie beállítások
    </button>
  );
}
