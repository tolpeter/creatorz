"use client";

import { useRef, useState, type PointerEvent } from "react";
import { ExternalLink, Play } from "lucide-react";

export type TikTokSliderVideo = {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  title?: string | null;
  author?: string | null;
};

/**
 * TikTok-előnézet: könnyű thumbnail-kártyák (mint a portfólió videófala) egy
 * vízszintesen GÖRGETHETŐ / HÚZHATÓ railben. Nem tölt be nehéz iframe-et, így
 * mobilon is azonnal látszik, és balra-jobbra húzható (egér + touch).
 * Kattintásra a TikTok-videó új lapon nyílik.
 */
export function TikTokVideoSlider({ videos }: { videos: TikTokSliderVideo[] }) {
  const visible = videos.slice(0, 12);
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  if (!visible.length) return null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    // Touch/pen: a natív görgetés (overflow-x-auto + touch-action) intézi —
    // a pointer-capture egyébként elnyelné a mobil swipe-ot.
    if (e.pointerType !== "mouse") return;
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
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#070807] p-3 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:rounded-[2rem] sm:p-5">
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
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-[#070807] to-transparent sm:w-10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-[#070807] to-transparent sm:w-10"
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
          className={`flex gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-4 ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          {visible.map((video) => (
            <a
              key={video.id}
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              draggable={false}
              title={video.title ?? "TikTok videó megtekintése"}
              className="group relative block w-[42vw] max-w-[200px] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black shadow-lg sm:w-[180px]"
            >
              {video.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnailUrl}
                  alt={video.title ?? ""}
                  draggable={false}
                  loading="lazy"
                  className="aspect-[9/16] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="flex aspect-[9/16] w-full items-center justify-center bg-[#151515]">
                  <Play className="h-9 w-9 text-white/60" />
                </div>
              )}
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-black shadow">
                <ExternalLink className="h-3 w-3" />
                TikTok
              </span>
              <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur transition-transform group-hover:scale-110">
                  <Play className="h-5 w-5 translate-x-0.5 fill-white" />
                </span>
              </span>
              {video.title && (
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black via-black/70 to-transparent p-2.5 pt-8 text-xs font-semibold text-white">
                  {video.title}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
