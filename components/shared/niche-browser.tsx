"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { NICHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NicheBrowser() {
  const [active, setActive] = useState(0);

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-2">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Keresd meg a legjobb tartalomgyártókat{" "}
            <span className="text-accent">kategóriák szerint</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fedezd fel a legjobb tartalomgyártókat minden kategóriában.
          </p>
        </div>

        {/* Vékony konténerek + smooth flex-animáció */}
        <div className="mt-10 flex gap-3 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {NICHES.map((n, i) => {
            const isActive = i === active;
            const url = `/creators?categories=${n.categories.join(",")}`;
            return (
              <div
                key={n.slug}
                role="button"
                tabIndex={0}
                onClick={() => setActive(i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
                aria-pressed={isActive}
                aria-label={n.label}
                className={cn(
                  "group relative h-80 shrink-0 cursor-pointer overflow-hidden rounded-2xl border bg-card outline-none transition-[flex,box-shadow,border-color] duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:ring-2 focus-visible:ring-accent",
                  isActive
                    ? "ring-2 ring-accent"
                    : "hover:border-accent/60 hover:shadow-md"
                )}
                style={{
                  flex: isActive ? "1 1 0%" : "0 0 56px",
                  minWidth: isActive ? 280 : 56,
                }}
              >
                {/* AKTÍV RÉTEG: kép + alsó sáv (fade in/out) */}
                <div
                  className={cn(
                    "absolute inset-0 transition-opacity duration-500",
                    isActive
                      ? "opacity-100 delay-200"
                      : "pointer-events-none opacity-0"
                  )}
                >
                  <Image
                    src={n.image}
                    alt={n.label}
                    fill
                    sizes="(max-width: 768px) 80vw, 600px"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <span className="text-left text-base font-semibold text-white">
                      {n.label}
                    </span>
                    <Link
                      href={url}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-transform hover:scale-105 hover:bg-accent/90"
                    >
                      Fedezze fel <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>

                {/* ÖSSZECSUKOTT RÉTEG: függőleges felirat (fade in/out) */}
                <span
                  className={cn(
                    "absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground transition-opacity duration-300",
                    isActive ? "pointer-events-none opacity-0" : "opacity-100 delay-300"
                  )}
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                  }}
                >
                  {n.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
