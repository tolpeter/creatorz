"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { CreatorCard, type CreatorCardData } from "@/components/creator/creator-card";

/**
 * Mobil-nézet: a kiemelt tartalomgyártók EGY SORBAN, vízszintesen, automatikusan
 * (balról jobbra) úsznak, végtelenítve — és kézzel is húzhatók balra-jobbra
 * (touch + egér). Asztali nézetben a főoldal a rács-elrendezést használja.
 */
export function FeaturedCreatorsCarousel({
  creators,
}: {
  creators: CreatorCardData[];
}) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);
  const draggedRef = useRef(false);
  const interactingRef = useRef(false); // touch/egér interakció alatt áll az auto-scroll
  const [dragging, setDragging] = useState(false);

  // Végtelenítés: a listát megduplázzuk, és a fél szélességnél visszaugrunk.
  const base = creators.length >= 4 ? creators : [...creators, ...creators];
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
          rail.scrollLeft = half; // középről indulunk, hogy legyen mit jobbra úsztatni
          started = true;
        }
        if (!interactingRef.current) {
          rail.scrollLeft -= 0.3; // a tartalom jobbra úszik (balról jobbra)
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
    interactingRef.current = true; // bármilyen érintés/kattintás megállítja az auto-scrollt
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
    interactingRef.current = false;
    setDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* a böngésző már elengedte */
    }
  }

  return (
    <div className="relative -mx-6">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent" />
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
        onClickCapture={(e) => {
          // Ha húzás közben volt a kattintás, ne navigáljon a kártyára.
          if (!draggedRef.current) return;
          e.preventDefault();
          e.stopPropagation();
          draggedRef.current = false;
        }}
        style={{ touchAction: "pan-x", overscrollBehaviorX: "contain" }}
        className={`flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          dragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
      >
        {railItems.map((creator, index) => (
          <div
            key={`${creator.username}-${index}`}
            className="w-[78vw] max-w-[19rem] shrink-0"
          >
            <CreatorCard creator={creator} />
          </div>
        ))}
      </div>
    </div>
  );
}
