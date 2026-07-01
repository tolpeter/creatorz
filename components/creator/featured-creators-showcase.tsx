"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { Camera, Music2, Star } from "lucide-react";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format";
import type { CreatorCardData } from "@/components/creator/creator-card";

function label(c: CreatorCardData): string {
  const cat = c.categories[0]
    ? CREATOR_CATEGORIES.find((x) => x.value === c.categories[0])?.label ??
      c.categories[0]
    : null;
  return [cat, c.city].filter(Boolean).join(" · ") || "Tartalomgyártó";
}

/** A magasabb követőszámú platform (Instagram vagy TikTok). */
function topFollowers(c: CreatorCardData): { n: number; platform: "ig" | "tt" } | null {
  const ig = c.instagramFollowers;
  const tt = c.tiktokFollowers;
  if (ig == null && tt == null) return null;
  if ((ig ?? -1) >= (tt ?? -1)) return { n: ig ?? 0, platform: "ig" };
  return { n: tt ?? 0, platform: "tt" };
}

function ShowcaseCard({ c }: { c: CreatorCardData }) {
  const f = topFollowers(c);
  return (
    <Link
      href={`/creators/${c.username}`}
      draggable={false}
      className="group relative block h-[220px] w-[152px] shrink-0 overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-[0_8px_24px_rgba(0,0,0,0.18)] sm:h-[340px] sm:w-[240px]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={c.avatarUrl ?? ""}
        alt={c.displayName}
        draggable={false}
        loading="lazy"
        className="absolute inset-0 h-full w-full select-none object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />

      {/* Követőszám */}
      {f && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-xs">
          {f.platform === "ig" ? (
            <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          ) : (
            <Music2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          )}
          {formatNumber(f.n)}
        </div>
      )}

      {/* Kiemelt jelvény */}
      {c.isFeatured && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black sm:right-3 sm:top-3 sm:px-2 sm:text-[11px]">
          <Star className="h-2.5 w-2.5 fill-black sm:h-3 sm:w-3" /> Kiemelt
        </div>
      )}

      {/* Név + kategória */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
        <h3 className="truncate text-sm font-bold text-white drop-shadow sm:text-lg">
          {c.displayName}
        </h3>
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-accent sm:text-xs">
          {label(c)}
        </p>
      </div>
    </Link>
  );
}

/**
 * Kiemelt tartalomgyártók — folyamatos, automatikusan úszó slideshow (marquee),
 * ami kézzel is húzható jobbra-balra (touch + egér). Asztali ÉS mobil.
 * A lista végtelenítve (duplikálva), a fél szélességnél visszaugrik.
 */
export function FeaturedCreatorsShowcase({
  creators,
}: {
  creators: CreatorCardData[];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedRef = useRef(false);
  const interactingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  // Végtelenítés: kevés elemnél többször ismételjük, hogy legyen mit úsztatni.
  const base =
    creators.length >= 6
      ? creators
      : creators.length >= 3
        ? [...creators, ...creators]
        : [...creators, ...creators, ...creators, ...creators];
  const railItems = [...base, ...base];

  useEffect(() => {
    if (creators.length === 0) return;
    const rail = railRef.current;
    if (!rail) return;

    let started = false;
    let frame = 0;
    const tick = () => {
      if (rail.scrollWidth > rail.clientWidth) {
        const half = rail.scrollWidth / 2;
        if (!started) {
          rail.scrollLeft = half;
          started = true;
        }
        if (!interactingRef.current) {
          rail.scrollLeft -= 0.4;
          if (rail.scrollLeft <= 0) rail.scrollLeft += half;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [creators.length]);

  if (creators.length === 0) return null;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    interactingRef.current = true;
    if (e.pointerType !== "mouse" || e.button !== 0) return; // touch: natív görgetés
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

  function endInteraction(e: PointerEvent<HTMLDivElement>) {
    // Kis késleltetés, hogy a lendület után folytatódjon az automata úszás.
    interactingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* már elengedve */
    }
  }

  return (
    <div className="relative -mx-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent sm:w-16" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent sm:w-16" />
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onClickCapture={(e) => {
          if (!draggedRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          draggedRef.current = false;
        }}
        style={{ touchAction: "pan-x", overscrollBehaviorX: "contain" }}
        className={`flex gap-3 overflow-x-auto px-6 py-3 sm:gap-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {railItems.map((c, i) => (
          <ShowcaseCard key={`${c.username}-${i}`} c={c} />
        ))}
      </div>
    </div>
  );
}
