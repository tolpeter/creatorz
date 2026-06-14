"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
import type { BrowseCard } from "@/components/creator/browse-creator-card";
import { Logo } from "@/components/layout/logo";
import { CREATOR_CATEGORIES, PROFESSIONAL_ROLES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils/format";

export function FeaturedCreatorsRail({ creators }: { creators: BrowseCard[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const draggedRef = useRef(false);
  const hoveringRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const isEmpty = creators.length === 0;
  const loopItems =
    creators.length >= 6 ? creators : [...creators, ...creators, ...creators];
  const railItems = [...loopItems, ...loopItems];

  useEffect(() => {
    if (isEmpty) return;
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const tick = () => {
      if (!dragging && !hoveringRef.current && rail.scrollWidth > rail.clientWidth) {
        rail.scrollLeft += 0.32;
        const half = rail.scrollWidth / 2;
        if (rail.scrollLeft >= half) rail.scrollLeft -= half;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [dragging, isEmpty]);

  if (isEmpty) return null;

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;

    setDragging(true);
    draggedRef.current = false;
    dragStartXRef.current = event.clientX;
    dragStartScrollRef.current = rail.scrollLeft;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging) return;
    const rail = railRef.current;
    if (!rail) return;

    const delta = event.clientX - dragStartXRef.current;
    if (Math.abs(delta) > 6) draggedRef.current = true;
    rail.scrollLeft = dragStartScrollRef.current - delta;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    setDragging(false);
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-black/10 bg-[#0b0d0a] px-4 py-5 text-white shadow-[0_24px_70px_rgba(0,0,0,0.16)] sm:px-5 lg:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(163,230,53,0.28),transparent_28%),linear-gradient(135deg,rgba(163,230,53,0.10),transparent_42%)]" />

      <div className="relative mb-4 flex items-end justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            <Sparkles className="h-3.5 w-3.5" />
            Kiemelt tagok
          </span>
          <h2 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
            Kiemelt tartalomgyártók
          </h2>
        </div>
      </div>

      <div className="relative -mx-4 sm:-mx-5 lg:-mx-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0b0d0a] to-transparent sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0b0d0a] to-transparent sm:w-16" />
        <div
          ref={railRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onMouseEnter={() => {
            hoveringRef.current = true;
          }}
          onMouseLeave={() => {
            hoveringRef.current = false;
            setDragging(false);
          }}
          onClickCapture={(event) => {
            if (!draggedRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            draggedRef.current = false;
          }}
          style={{ touchAction: "pan-x", overscrollBehaviorX: "contain" }}
          className={`overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-5 lg:px-6 [&::-webkit-scrollbar]:hidden ${
            dragging ? "cursor-grabbing select-none" : "cursor-grab"
          }`}
        >
          <div className="flex w-max gap-4">
            {railItems.map((creator, index) => (
              <FeaturedCreatorCard key={`${creator.id}-${index}`} creator={creator} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCreatorCard({ creator }: { creator: BrowseCard }) {
  const isProfessional = creator.profileKind === "professional";
  const roleLabels = (creator.professionalRoles ?? [])
    .map((role) => PROFESSIONAL_ROLES.find((item) => item.value === role)?.label ?? role)
    .slice(0, 2);
  const categoryLabels = isProfessional
    ? roleLabels
    : creator.categories
        .map((category) => CREATOR_CATEGORIES.find((item) => item.value === category)?.label ?? category)
        .slice(0, 2);
  const followerCount = creator.tiktokFollowers ?? creator.instagramFollowers ?? 0;

  return (
    <Link
      href={`/creators/${creator.username}`}
      draggable={false}
      className="group w-[17.5rem] shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.08] p-3 shadow-[0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-accent/70 hover:bg-white/[0.12] sm:w-[20rem]"
    >
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/15">
          {creator.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.avatarUrl}
              alt={creator.displayName}
              draggable={false}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-white">
              <Logo variant="dark" className="text-xs" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-lg font-semibold leading-tight">
              {creator.displayName}
            </h3>
            {creator.verified ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
            ) : null}
          </div>
          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-white/58">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {creator.city || "Online"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {categoryLabels.map((label) => (
          <span
            key={label}
            className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/82 ring-1 ring-white/10"
          >
            {label}
          </span>
        ))}
        {creator.isFeatured ? (
          <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-black">
            Kiemelt
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-white/10 bg-black/18">
        <Metric
          icon={<UsersRound className="h-4 w-4" />}
          value={formatNumber(followerCount)}
          label="Követők"
        />
        <Metric
          icon={<Star className="h-4 w-4" />}
          value={creator.averageRating ?? "-"}
          label="Értékelés"
        />
        <Metric
          icon={<ArrowRight className="h-4 w-4" />}
          value={creator.hasVideo ? "Pitch" : "Profil"}
          label="Megnyitás"
        />
      </div>
    </Link>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <span className="flex min-w-0 flex-col gap-1 border-r border-white/10 px-3 py-2 last:border-r-0">
      <span className="text-accent">{icon}</span>
      <span className="truncate text-sm font-semibold leading-tight">{value}</span>
      <span className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-white/45">
        {label}
      </span>
    </span>
  );
}
