"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Gift, Link2, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { SocialTile } from "@/components/creator/platform-icon";

const REWARD_DAYS = 7;

/* ───────────────────────── Ajánlási (referral) kártya ───────────────────── */

export function ReferralCard({
  inviteUrl,
  count,
}: {
  inviteUrl: string;
  count: number;
}) {
  const [copied, setCopied] = useState(false);
  const earnedDays = count * REWARD_DAYS;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Meghívó link másolva!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nem sikerült másolni a linket.");
    }
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`,
      "_blank",
      "noopener,noreferrer,width=660,height=620",
    );
  }

  async function nativeShare() {
    const text =
      "Csatlakozz hozzám a Creatorzon — a magyar UGC tartalomgyártó közösségben!";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Creatorz meghívó", text, url: inviteUrl });
      } catch {
        /* megszakítva */
      }
    } else {
      copyLink();
    }
  }

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b bg-gradient-to-r from-accent/15 to-transparent p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Gift className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">Hívj meg egy alkotót — kapj kiemelést</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Minden sikeres meghívás után{" "}
            <span className="font-semibold text-foreground">{REWARD_DAYS} nap</span>{" "}
            kiemelést kapsz a keresőben. A meghívottnak ingyenes a regisztráció.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Link + másolás */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 truncate rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-foreground"
          />
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#0a0a0a] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent hover:text-black"
          >
            {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
            {copied ? "Másolva" : "Másolás"}
          </button>
        </div>

        {/* Megosztás */}
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
            onClick={nativeShare}
            className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Share2 className="h-4 w-4" />
            Megosztás
          </button>
        </div>

        {/* Statisztika */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Sikeres meghívás
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">{count}</p>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Szerzett kiemelés
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold">
              {earnedDays} <span className="text-base font-medium text-muted-foreground">nap</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── Megosztható profil-kártya (badge) ─────────────────── */

export function ProfileShareCard({
  profileUrl,
  displayName,
  username,
  avatarUrl,
}: {
  profileUrl: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success("Profil link másolva!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Nem sikerült másolni a linket.");
    }
  }

  function shareFacebook() {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      "_blank",
      "noopener,noreferrer,width=660,height=620",
    );
  }

  async function nativeShare() {
    const text = "Csatlakoztam a Creatorzhoz! Nézd meg a profilom 👇";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: `${displayName} — Creatorz`, text, url: profileUrl });
      } catch {
        /* megszakítva */
      }
    } else {
      copyLink();
    }
  }

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <section className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="flex items-start gap-3 border-b p-5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-bold">Oszd meg a profilod</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Büszkélkedj a közösségi oldalaidon — minél többen látják, annál több
            megkeresést kapsz.
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {/* Kártya-előnézet */}
        <div className="relative overflow-hidden rounded-xl border bg-[#0a0a0a] p-5 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
          />
          <div className="relative flex items-center gap-4">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-white/25 bg-white/10">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-2xl font-bold">
                  {initial}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-bold">{displayName}</p>
              <p className="truncate text-sm text-white/60">@{username}</p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-black">
                <Sparkles className="h-3 w-3" />
                Csatlakoztam a Creatorzhoz
              </span>
            </div>
          </div>
        </div>

        {/* Megosztás */}
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
    </section>
  );
}
