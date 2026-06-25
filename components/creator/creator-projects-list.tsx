"use client";

import Link from "next/link";
import { Handshake, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type CreatorProjectItem } from "@/app/actions/creator-projects";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));

export function CreatorProjectsList({ items }: { items: CreatorProjectItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
        <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
        Még nincs közös projekted. Egy másik alkotó profilján a „Közös munkára felkérés"
        gombbal indíthatsz egyet — márka nélkül is.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((p) => {
        const closed = p.status === "closed";
        const inReview = !closed && p.status === "review_pending";
        return (
          <Link
            key={p.id}
            href={`/creator/projects/${p.id}`}
            className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={p.partnerAvatar ?? undefined} />
                <AvatarFallback>{p.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold">{p.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {p.iAmRequester ? "Te hívtad: " : "Téged hívott: "}
                  {p.partnerName} · {fmt(p.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {closed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
                </span>
              ) : inReview ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                  <Star className="h-3.5 w-3.5" /> Értékelésre vár
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
                  Aktív
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7c0f]">
                Megnyitás <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
