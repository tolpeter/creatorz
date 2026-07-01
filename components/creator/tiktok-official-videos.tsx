"use client";

import { useState } from "react";
import { ExternalLink, Play } from "lucide-react";
import {
  TikTokPlayerModal,
  extractTikTokId,
} from "@/components/creator/tiktok-player-modal";

type TikTokVideo = {
  id: string;
  title: string | null;
  coverUrl: string | null;
  shareUrl: string | null;
  viewCount: number | null;
  createTime: number | null;
};

function fmtViews(n: number | null): string | null {
  if (n == null) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}E`;
  return String(n);
}

/**
 * A creator legutóbbi publikus TikTok-videói a HIVATALOS TikTok API-ból
 * (video.list scope). A borítóképet maga a TikTok adja (cover_image_url),
 * ezért nincs szükség proxyra/scrape-re.
 */
export function TikTokOfficialVideos({
  videos,
  handle,
}: {
  videos: TikTokVideo[];
  handle?: string | null;
}) {
  const list = videos.filter((v) => v.coverUrl && v.shareUrl).slice(0, 9);
  const [playing, setPlaying] = useState<{ id: string; url: string | null } | null>(null);
  if (list.length === 0) return null;

  function open(v: TikTokVideo) {
    const id = /^\d{6,}$/.test(v.id) ? v.id : extractTikTokId(v.shareUrl);
    if (id) setPlaying({ id, url: v.shareUrl });
    else if (v.shareUrl) window.open(v.shareUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-[#070807] p-6 text-white shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
            TikTok videók
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {handle ? `@${handle}` : "Legutóbbi videók"}
          </h2>
          <p className="mt-1 text-sm text-white/60">
            A creator hivatalosan összekötött TikTok-fiókjának publikus videói.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {list.map((v) => {
          const views = fmtViews(v.viewCount);
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => open(v)}
              className="group relative block cursor-pointer overflow-hidden rounded-xl bg-white/5"
              style={{ aspectRatio: "9 / 16" }}
              title={v.title ?? "TikTok videó lejátszása"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={v.coverUrl ?? ""}
                alt={v.title ?? "TikTok videó"}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white opacity-90 backdrop-blur">
                <Play className="h-3.5 w-3.5 fill-current" />
              </span>
              {views ? (
                <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                  <Play className="h-3 w-3 fill-current" /> {views}
                </span>
              ) : null}
              <span className="absolute bottom-2 right-2 text-white/70 opacity-0 transition-opacity group-hover:opacity-100">
                <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </button>
          );
        })}
      </div>

      {playing && (
        <TikTokPlayerModal
          videoId={playing.id}
          shareUrl={playing.url}
          onClose={() => setPlaying(null)}
        />
      )}
    </section>
  );
}
