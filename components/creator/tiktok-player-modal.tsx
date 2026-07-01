"use client";

import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

/** TikTok videó-ID kinyerése a különböző URL-formátumokból. */
export function extractTikTokId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m =
    url.match(/\/video\/(\d{6,})/) ||
    url.match(/\/v\/(\d{6,})/) ||
    url.match(/[?&]item_id=(\d{6,})/) ||
    url.match(/(\d{15,})/);
  return m ? m[1] : null;
}

/**
 * Helyben lejátszó modal a hivatalos TikTok player-iframe-mel
 * (https://www.tiktok.com/player/v1/{id}). Publikus, beágyazható videóknál
 * azonnal indul; ha a videó nem ágyazható, a "Megnyitás TikTokon" link segít.
 */
export function TikTokPlayerModal({
  videoId,
  shareUrl,
  onClose,
}: {
  videoId: string;
  shareUrl?: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-[340px] overflow-hidden rounded-2xl bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Bezárás"
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="aspect-[9/16] w-full">
          <iframe
            src={`https://www.tiktok.com/player/v1/${videoId}?autoplay=1&music_info=1&description=1`}
            className="h-full w-full"
            title="TikTok videó"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        {shareUrl && (
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-[#0a0a0a] py-2.5 text-xs font-semibold text-white/80 transition hover:text-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Megnyitás TikTokon
          </a>
        )}
      </div>
    </div>
  );
}
