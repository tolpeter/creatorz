"use client";

import { useId, type SVGProps } from "react";

export type Platform = "instagram" | "tiktok" | "facebook" | "youtube";

/**
 * Teljes márka-csempe: lekerekített négyzet a platform saját háttérszínével
 * és logójával (mint a mockupon). A méretet a `className` vezérli.
 * Vektoros, így bármilyen méretben éles és reszponzív.
 */
export function SocialTile({
  platform,
  className = "h-14 w-14",
}: {
  platform: Platform;
  className?: string;
}) {
  const cls = `${className} shrink-0 rounded-2xl shadow-sm ring-1 ring-black/5`;
  switch (platform) {
    case "tiktok":
      return <TikTokTile className={cls} />;
    case "youtube":
      return <YouTubeTile className={cls} />;
    case "instagram":
      return <InstagramTile className={cls} />;
    case "facebook":
      return <FacebookTile className={cls} />;
  }
}

function TikTokTile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-label="TikTok" {...props}>
      <rect width="48" height="48" rx="12" fill="#010101" />
      {/* cyan + red glitch + fehér főlogó */}
      <path
        d="M30.8 13.3c-2.9 0-5.2-2.35-5.2-5.25V8h-3.1v18.9a3.55 3.55 0 1 1-3.55-3.55c.32 0 .63.04.93.12v-3.2a6.75 6.75 0 1 0 5.72 6.67V18.7a8.3 8.3 0 0 0 5.2 1.8z"
        fill="#25F4EE"
        transform="translate(-1.1,1.1)"
      />
      <path
        d="M30.8 13.3c-2.9 0-5.2-2.35-5.2-5.25V8h-3.1v18.9a3.55 3.55 0 1 1-3.55-3.55c.32 0 .63.04.93.12v-3.2a6.75 6.75 0 1 0 5.72 6.67V18.7a8.3 8.3 0 0 0 5.2 1.8z"
        fill="#FE2C55"
        transform="translate(1.1,-1.1)"
      />
      <path
        d="M30.8 13.3c-2.9 0-5.2-2.35-5.2-5.25V8h-3.1v18.9a3.55 3.55 0 1 1-3.55-3.55c.32 0 .63.04.93.12v-3.2a6.75 6.75 0 1 0 5.72 6.67V18.7a8.3 8.3 0 0 0 5.2 1.8z"
        fill="#fff"
      />
    </svg>
  );
}

function YouTubeTile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-label="YouTube" {...props}>
      <rect width="48" height="48" rx="12" fill="#fff" />
      <rect x="9" y="15" width="30" height="18" rx="5.5" fill="#FF0000" />
      <path d="M21 20.3 28.2 24 21 27.7z" fill="#fff" />
    </svg>
  );
}

function InstagramTile(props: SVGProps<SVGSVGElement>) {
  // Egyedi gradiens-id, hogy ne ütközzön, ha több Instagram-csempe is van az
  // oldalon (pl. a profil mobil + desktop SocialStats blokkjában egyszerre).
  const gid = `ig-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox="0 0 48 48" aria-label="Instagram" {...props}>
      <defs>
        <radialGradient id={gid} cx="28%" cy="105%" r="135%">
          <stop offset="0%" stopColor="#FFD776" />
          <stop offset="22%" stopColor="#F9A237" />
          <stop offset="42%" stopColor="#FD5949" />
          <stop offset="62%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${gid})`} />
      <rect
        x="13"
        y="13"
        width="22"
        height="22"
        rx="6.5"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
      />
      <circle cx="24" cy="24" r="5.4" fill="none" stroke="#fff" strokeWidth="2.4" />
      <circle cx="30.6" cy="17.4" r="1.5" fill="#fff" />
    </svg>
  );
}

function FacebookTile(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" aria-label="Facebook" {...props}>
      <rect width="48" height="48" rx="12" fill="#1877F2" />
      <path
        d="M28.5 25.2h3.1l.6-3.9h-3.7v-2.5c0-1.1.4-1.9 1.9-1.9h2V13.3c-.4-.05-1.6-.18-3-.18-3.1 0-5.2 1.9-5.2 5.35v3.0h-3.4v3.9h3.4V35h4.3z"
        fill="#fff"
      />
    </svg>
  );
}
