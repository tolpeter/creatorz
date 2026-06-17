"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/layout/logo";

/**
 * Kattintható profilkép — ha van avatar, nagyban megnyitható lightboxban.
 * (A profil-oldal fejlécében használjuk.)
 */
export function AvatarLightbox({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const [open, setOpen] = useState(false);

  const avatar = (
    <Avatar className="h-20 w-20 border border-accent/40 ring-4 ring-accent/18 sm:h-32 sm:w-32">
      <AvatarImage src={src ?? undefined} alt={alt} />
      <AvatarFallback className="bg-white text-3xl font-black text-black">
        <Logo variant="dark" className="text-sm sm:text-lg" />
      </AvatarFallback>
    </Avatar>
  );

  if (!src) return avatar;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Profilkép megnyitása nagyban"
        className="block cursor-zoom-in rounded-full outline-none transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-accent"
      >
        {avatar}
      </button>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        carousel={{ finite: true }}
        render={{ buttonPrev: () => null, buttonNext: () => null }}
      />
    </>
  );
}
