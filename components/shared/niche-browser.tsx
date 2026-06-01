"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { NICHES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function NicheBrowser() {
  const [active, setActive] = useState(0);
  const niche = NICHES[active]!;
  const url = `/creators?categories=${niche.categories.join(",")}`;

  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-2">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Keresd meg a legjobb tartalomgyártókat{" "}
            <span className="text-accent">niche szerint</span>
          </h2>
          <p className="mt-2 text-muted-foreground">
            Fedezd fel a legjobb tartalomgyártókat minden réspiacon és kategóriában.
          </p>
        </div>

        {/* Niche oszlopok — aktív kibővül a képpel + CTA-val */}
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
          {NICHES.map((n, i) => {
            const isActive = i === active;
            return (
              <button
                key={n.slug}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "group relative flex h-72 items-end justify-center overflow-hidden rounded-2xl border bg-card transition-all",
                  isActive
                    ? "ring-2 ring-accent sm:col-span-2 lg:col-span-3"
                    : "hover:border-accent/60"
                )}
              >
                {isActive ? (
                  <>
                    <Image
                      src={n.image}
                      alt={n.label}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <span className="text-left text-base font-semibold text-white">
                        {n.label}
                      </span>
                      <Link
                        href={url}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground hover:bg-accent/90"
                      >
                        Fedezze fel <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </>
                ) : (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-foreground"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)",
                    }}
                  >
                    {n.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
