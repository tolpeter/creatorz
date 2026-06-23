"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Link2, Share2 } from "lucide-react";
import { SocialTile } from "@/components/creator/platform-icon";

/**
 * Kampány-megosztó gombok: egy kattintással Facebook-megosztás, link-másolás,
 * és mobilon natív megosztás. A Facebook a kampány OG-tagjeit (cím, borítókép)
 * automatikusan beolvassa az URL-ből.
 */
export function AdShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=660,height=620",
    );
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link másolva!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nem sikerült másolni a linket.");
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        /* a felhasználó megszakította */
      }
    } else {
      copyLink();
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Megosztás
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={shareFacebook}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1877F2] px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <SocialTile platform="facebook" className="h-4 w-4 rounded" />
          Facebook
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted"
        >
          {copied ? <Check className="h-4 w-4 text-[#4d7c0f]" /> : <Link2 className="h-4 w-4" />}
          {copied ? "Másolva" : "Link másolása"}
        </button>
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted sm:hidden"
        >
          <Share2 className="h-4 w-4" />
          Több
        </button>
      </div>
    </div>
  );
}
