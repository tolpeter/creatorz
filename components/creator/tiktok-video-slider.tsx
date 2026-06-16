"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ExternalLink, Play } from "lucide-react";

export type TikTokSliderVideo = {
  id: string;
  url: string;
  html: string;
  title?: string | null;
};

/**
 * TikTok-előnézet: vízszintesen GÖRGETHETŐ / HÚZHATÓ carousel (nem auto-marquee).
 * - Mobilon natív touch-swipe (scroll-snap).
 * - Desktopon egér-húzás (pointer drag) is működik.
 * - A kártyák a képernyőmérethez igazodnak, nem lógnak ki.
 */
export function TikTokVideoSlider({ videos }: { videos: TikTokSliderVideo[] }) {
  const visible = videos.slice(0, 8);
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!visible.length) return;
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.tiktok.com/embed.js"]',
    );
    existing?.remove();
    const script = document.createElement("script");
    script.src = "https://www.tiktok.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
  }, [visible.length]);

  if (!visible.length) return null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;
    setDragging(true);
    draggedRef.current = false;
    dragStartX.current = e.clientX;
    dragStartScroll.current = rail.scrollLeft;
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const rail = railRef.current;
    if (!rail) return;
    const delta = e.clientX - dragStartX.current;
    if (Math.abs(delta) > 6) draggedRef.current = true;
    rail.scrollLeft = dragStartScroll.current - delta;
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* már elengedte a böngésző */
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#070807] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            TikTok preview
          </p>
          <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
            Legfrissebb videók
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Play className="h-3.5 w-3.5 fill-current" />
          Húzd balra-jobbra
        </span>
      </div>

      <div className="relative -mx-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#070807] to-transparent sm:w-12"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#070807] to-transparent sm:w-12"
        />
        <div
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClickCapture={(e) => {
            if (!draggedRef.current) return;
            e.preventDefault();
            e.stopPropagation();
            draggedRef.current = false;
          }}
          className={`flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          {visible.map((video) => (
            <article
              key={video.id}
              className="w-[78vw] max-w-[320px] shrink-0 snap-center overflow-hidden rounded-3xl border border-white/10 bg-white p-2 shadow-lg sm:w-[300px]"
            >
              <div
                className="creator-tiktok-embed"
                dangerouslySetInnerHTML={{ __html: video.html }}
              />
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A0A0A] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1b1b1b]"
              >
                TikTok megnyitása <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .creator-tiktok-embed .tiktok-embed,
        .creator-tiktok-embed blockquote {
          margin: 0 !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }
        .creator-tiktok-embed iframe {
          border-radius: 1.25rem !important;
          overflow: hidden !important;
          max-width: 100% !important;
        }
      `}</style>
    </div>
  );
}
