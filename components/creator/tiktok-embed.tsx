"use client";

import { useEffect, useRef } from "react";

/**
 * TikTok oEmbed beágyazás. A szervertől kapott oEmbed `html`-t rendereli
 * (ami egy .tiktok-embed blockquote), majd betölti a TikTok embed.js-t,
 * ami a videót ténylegesen kirendereli.
 */
export function TikTokEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;

    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.tiktok.com/embed.js"]'
    );
    if (existing) {
      // újra-szkennelés, ha az SDK már betöltött
      (window as unknown as { tiktokEmbed?: { lib?: { render?: () => void } } })
        .tiktokEmbed?.lib?.render?.();
      // friss script injektálása a feldolgozáshoz
      existing.remove();
    }
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [html]);

  return <div ref={ref} className="tiktok-embed-container" />;
}
