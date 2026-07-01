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
function topFollowers(
  c: CreatorCardData,
): { n: number; platform: "ig" | "tt" } | null {
  const ig = c.instagramFollowers;
  const tt = c.tiktokFollowers;
  if (ig == null && tt == null) return null;
  if ((ig ?? -1) >= (tt ?? -1)) return { n: ig ?? 0, platform: "ig" };
  return { n: tt ?? 0, platform: "tt" };
}

export function ShowcaseCard({ c }: { c: CreatorCardData }) {
  const f = topFollowers(c);
  return (
    <Link
      href={`/creators/${c.username}`}
      draggable={false}
      className="group relative block h-[210px] w-[146px] shrink-0 overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
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

      {f && (
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {f.platform === "ig" ? (
            <Camera className="h-3 w-3" />
          ) : (
            <Music2 className="h-3 w-3" />
          )}
          {formatNumber(f.n)}
        </div>
      )}

      {c.isFeatured && (
        <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
          <Star className="h-2.5 w-2.5 fill-black" /> Kiemelt
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <h3 className="truncate text-sm font-bold text-white drop-shadow">
          {c.displayName}
        </h3>
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-accent">
          {label(c)}
        </p>
      </div>
    </Link>
  );
}

/**
 * Egy vízszintes marquee-sor: folyamatosan úszik (irány szerint), végtelenítve,
 * és kézzel is húzható. A `direction="left"` balra úsztat, `"right"` jobbra.
 */
function MarqueeRow({
  creators,
  direction,
}: {
  creators: CreatorCardData[];
  direction: "left" | "right";
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedRef = useRef(false);
  const interactingRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const base = creators.length >= 6 ? creators : [...creators, ...creators];
  const railItems = [...base, ...base];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let frame = 0;
    // A pozíciót JS-ben halmozzuk (tört értékkel), így akkor is folyamatosan
    // mozog, ha a böngésző a scrollLeftet egészre kerekíti — és mindkét sor
    // (bal/jobb irány) biztosan úszik.
    let pos = -1;
    const speed = direction === "left" ? 0.4 : -0.4;
    const tick = () => {
      const half = rail.scrollWidth / 2;
      if (half > 4) {
        if (pos < 0) pos = direction === "right" ? half : 0;
        if (interactingRef.current) {
          pos = rail.scrollLeft; // húzás alatt szinkronban maradunk
        } else {
          pos += speed;
          if (pos >= half) pos -= half;
          else if (pos < 0) pos += half;
          rail.scrollLeft = pos;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [direction]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    interactingRef.current = true;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
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
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background to-transparent" />
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
        className={`flex gap-3 overflow-x-auto px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
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

/**
 * Kiemelt tartalomgyártók MOBIL nézet: KÉT sor egymás alatt — a felső balra,
 * az alsó jobbra úszik (ellentétes irány), mindkettő kézzel húzható.
 */
export function FeaturedTwoRowMarquee({
  creators,
}: {
  creators: CreatorCardData[];
}) {
  if (creators.length === 0) return null;
  const bottom = [...creators].reverse();
  return (
    <div className="space-y-3">
      <MarqueeRow creators={creators} direction="left" />
      <MarqueeRow creators={bottom} direction="right" />
    </div>
  );
}
