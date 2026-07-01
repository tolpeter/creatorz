"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CREATOR_CATEGORIES } from "@/lib/constants";
import type { CreatorCardData } from "@/components/creator/creator-card";

/**
 * "Expanding cards" carousel (asztali) — a Simey-féle demo nyomán a projektbe
 * adaptálva. A layout tisztán CSS (globals.css `.fc-*`), a rotáció/aktiválás
 * imperatív DOM-logika. Mobilon ez rejtve; ott a kétsoros marquee fut.
 */
function label(c: CreatorCardData): string {
  const cat = c.categories[0]
    ? CREATOR_CATEGORIES.find((x) => x.value === c.categories[0])?.label ??
      c.categories[0]
    : null;
  return [cat, c.city].filter(Boolean).join(" · ") || "Tartalomgyártó";
}

export function FeaturedExpandingCarousel({
  creators,
}: {
  creators: CreatorCardData[];
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const activeStart = creators.length > 4 ? 4 : Math.floor(creators.length / 2);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const items = () => [...root.querySelectorAll<HTMLElement>(".fc-item")];
    const list = root.querySelector<HTMLElement>(".fc-list");
    if (!list) return;

    const indexOf = (el: Element | null) =>
      el ? items().indexOf(el as HTMLElement) : -1;
    const activeIndex = () => indexOf(root.querySelector("[data-active]"));
    const activate = (slide: HTMLElement | null) => {
      if (!slide) return;
      items().forEach((el) => el.removeAttribute("data-active"));
      slide.setAttribute("data-active", "true");
    };
    const prevSlide = () => {
      const idx = activeIndex();
      const all = items();
      const last = all[all.length - 1];
      if (!last) return;
      last.remove();
      list.prepend(last);
      activate(items()[idx]);
    };
    const nextSlide = () => {
      const idx = activeIndex();
      const all = items();
      const first = all[0];
      if (!first) return;
      first.remove();
      list.append(first);
      activate(items()[idx]);
    };
    const chooseSlide = (e: Event) => {
      const max = 8;
      const slide = (e.target as HTMLElement).closest<HTMLElement>(".fc-item");
      if (!slide) return;
      const idx = indexOf(slide);
      if (idx < 3 || idx > max) return;
      if (idx === max) nextSlide();
      if (idx === 3) prevSlide();
      activate(slide);
    };

    let auto = window.setInterval(nextSlide, 3500);
    const pause = () => window.clearInterval(auto);
    const resume = () => {
      pause();
      auto = window.setInterval(nextSlide, 3500);
    };

    const onNext = () => {
      pause();
      nextSlide();
    };
    const onPrev = () => {
      pause();
      prevSlide();
    };
    const onChoose = (e: Event) => {
      if ((e.target as HTMLElement).closest("a")) return; // névre → navigáció
      pause();
      chooseSlide(e);
    };
    const onFocusIn = (e: Event) => {
      pause();
      chooseSlide(e);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") onPrev();
      else if (e.key === "ArrowRight" || e.key === "d") onNext();
    };

    const next = root.querySelector<HTMLElement>(".fc-next");
    const prev = root.querySelector<HTMLElement>(".fc-prev");
    next?.addEventListener("click", onNext);
    prev?.addEventListener("click", onPrev);
    list.addEventListener("click", onChoose);
    list.addEventListener("focusin", onFocusIn);
    list.addEventListener("keyup", onKey as EventListener);
    root.addEventListener("mouseenter", pause);
    root.addEventListener("mouseleave", resume);

    return () => {
      pause();
      next?.removeEventListener("click", onNext);
      prev?.removeEventListener("click", onPrev);
      list.removeEventListener("click", onChoose);
      list.removeEventListener("focusin", onFocusIn);
      list.removeEventListener("keyup", onKey as EventListener);
      root.removeEventListener("mouseenter", pause);
      root.removeEventListener("mouseleave", resume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="fc-carousel">
      <ul className="fc-list">
        {creators.map((c, i) => (
          <li
            key={c.username}
            className="fc-item"
            tabIndex={0}
            {...(i === activeStart ? { "data-active": "true" } : {})}
          >
            <div className="fc-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.avatarUrl ?? ""}
                alt={c.displayName}
                width={480}
                height={720}
                loading={i < 6 ? "eager" : "lazy"}
              />
            </div>
            <div className="fc-contents">
              <h3 className="fc-name">
                <Link href={`/creators/${c.username}`}>{c.displayName}</Link>
              </h3>
              <p className="fc-title">{label(c)}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="fc-nav">
        <button type="button" className="fc-prev" aria-label="Előző">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M9.586 4l-6.586 6.586a2 2 0 0 0 0 2.828l6.586 6.586a2 2 0 0 0 2.18 .434l.145 -.068a2 2 0 0 0 1.089 -1.78v-2.586h7a2 2 0 0 0 2 -2v-4l-.005 -.15a2 2 0 0 0 -1.995 -1.85l-7 -.001v-2.585a2 2 0 0 0 -3.414 -1.414z" />
          </svg>
        </button>
        <button type="button" className="fc-next" aria-label="Következő">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <path d="M12.089 3.634a2 2 0 0 0 -1.089 1.78l-.001 2.586h-6.999a2 2 0 0 0 -2 2v4l.005 .15a2 2 0 0 0 1.995 1.85l6.999 -.001l.001 2.587a2 2 0 0 0 3.414 1.414l6.586 -6.586a2 2 0 0 0 0 -2.828l-6.586 -6.586a2 2 0 0 0 -2.18 -.434l-.145 .068z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
