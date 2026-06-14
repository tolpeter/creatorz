"use client";

import { useEffect } from "react";
import type { CSSProperties } from "react";
import { ExternalLink, Play } from "lucide-react";

export type TikTokSliderVideo = {
  id: string;
  url: string;
  html: string;
  title?: string | null;
};

export function TikTokVideoSlider({ videos }: { videos: TikTokSliderVideo[] }) {
  const visible = videos.slice(0, 5);
  const animated = visible.length > 1;
  const looped = animated ? [...visible, ...visible] : visible;
  const duration = `${Math.max(32, visible.length * 14)}s`;

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

  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#070807] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent">
            TikTok preview
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">Legfrissebb videók</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Play className="h-3.5 w-3.5 fill-current" />
          Beágyazott előnézet
        </span>
      </div>

      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-14 bg-gradient-to-r from-[#070807] to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-14 bg-gradient-to-l from-[#070807] to-transparent"
        />
        <div
          className="creator-tiktok-marquee-track flex w-max gap-4"
          data-animate={animated ? "true" : "false"}
          style={{ "--marquee-duration": duration } as CSSProperties}
        >
          {looped.map((video, index) => (
            <article
              key={`${video.id}-${index}`}
              className="creator-tiktok-card w-[min(74vw,300px)] shrink-0 overflow-hidden rounded-3xl border border-white/10 bg-white p-2 shadow-lg"
              aria-hidden={index >= visible.length ? true : undefined}
            >
              <div
                className="creator-tiktok-embed min-h-[520px]"
                dangerouslySetInnerHTML={{ __html: video.html }}
              />
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0A0A0A] px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1b1b1b]"
              >
                TikTok megnyitása <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .creator-tiktok-marquee-track[data-animate="true"] {
          animation: creator-tiktok-marquee-right var(--marquee-duration) linear infinite;
          transform: translateX(-50%);
        }

        .creator-tiktok-marquee-track[data-animate="true"]:hover {
          animation-play-state: paused;
        }

        .creator-tiktok-card .tiktok-embed,
        .creator-tiktok-card blockquote {
          margin: 0 !important;
          min-width: 100% !important;
          max-width: 100% !important;
        }

        .creator-tiktok-card iframe {
          border-radius: 1.25rem !important;
          overflow: hidden !important;
        }

        @keyframes creator-tiktok-marquee-right {
          from {
            transform: translateX(-50%);
          }
          to {
            transform: translateX(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .creator-tiktok-marquee-track[data-animate="true"] {
            animation: none;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
