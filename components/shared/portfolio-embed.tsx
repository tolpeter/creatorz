"use client";

import { parseEmbedLink } from "@/lib/utils/embed";
import { ExternalLink } from "lucide-react";

/**
 * Külső portfólió link előnézete: Drive/YouTube/Vimeo beágyazva (16:9 iframe),
 * minden más kattintható "Megnyitás" kártyaként.
 */
export function PortfolioEmbed({ url, title }: { url: string; title?: string | null }) {
  const parsed = parseEmbedLink(url);

  // Sima link (nem beágyazható) -> kártya kattintható gombbal
  if (parsed.type === "link" || !parsed.embedUrl) {
    return (
      <a
        href={parsed.originalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border bg-muted/40 p-8 text-sm font-medium transition-colors hover:border-accent/50 hover:bg-muted"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate">{title || "Munka megtekintése"}</span> — megnyitás új lapon
      </a>
    );
  }

  // Beágyazható videó (Drive / YouTube / Vimeo)
  return (
    <div className="overflow-hidden rounded-xl border bg-black">
      <div className="aspect-video w-full">
        <iframe
          src={parsed.embedUrl}
          title={title || "Portfólió videó"}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      {title && <p className="truncate px-3 py-2 text-sm text-white/80">{title}</p>}
    </div>
  );
}
