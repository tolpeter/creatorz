"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Package,
  PencilLine,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreatorReviewModal } from "@/components/shared/creator-review-modal";
import { BrandReviewModal } from "@/components/shared/brand-review-modal";
import {
  markDelivered,
  markCompleted,
  requestChanges,
  type CollabDetail,
} from "@/app/actions/collaborations";

const fmtDate = (d: Date | string | null) =>
  d ? new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d)) : null;

export function CollaborationWorkspace({ c }: { c: CollabDetail }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const completed = !!c.completedAt || c.status === "closed" || c.status === "reviewed";
  const delivered = !!c.deliveredAt || completed;
  const isCreator = c.viewerRole === "creator";
  const isBrand = c.viewerRole === "brand";
  const lastEvent = c.events[c.events.length - 1];
  const changesPending =
    !delivered && !completed && lastEvent?.kind === "changes_requested";
  const messagesHref = isCreator ? "/creator/messages" : "/brand/messages";

  const steps = [
    { label: "Elfogadva", date: fmtDate(c.acceptedAt), done: true },
    { label: "Leadva", date: fmtDate(c.deliveredAt), done: delivered },
    { label: "Lezárva", date: fmtDate(c.completedAt), done: completed },
  ];

  function run(fn: () => Promise<{ error?: string; success?: boolean }>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(ok);
        router.refresh();
      }
    });
  }

  const [showChange, setShowChange] = useState(false);
  const [changeNote, setChangeNote] = useState("");

  return (
    <div className="space-y-5">
      {/* Fejléc */}
      <div className="flex items-start justify-between gap-4 rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={c.partnerAvatar ?? undefined} />
            <AvatarFallback>{c.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{c.partnerName}</p>
            <p className="truncate text-sm text-muted-foreground">{c.adTitle}</p>
          </div>
        </div>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
          </span>
        ) : changesPending ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <PencilLine className="h-3.5 w-3.5" /> Változtatás kérve
          </span>
        ) : delivered ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Package className="h-3.5 w-3.5" /> Jóváhagyásra vár
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Clock className="h-3.5 w-3.5" /> Folyamatban
          </span>
        )}
      </div>

      {/* Idővonal */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full border-2",
                    s.done
                      ? "border-accent bg-accent text-black"
                      : "border-muted bg-background text-muted-foreground",
                  )}
                >
                  {s.done ? <Check className="h-5 w-5" /> : <span className="text-xs">{i + 1}</span>}
                </span>
                <span className="mt-1.5 text-xs font-semibold">{s.label}</span>
                <span className="text-[11px] text-muted-foreground">{s.date ?? "—"}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-1 h-0.5 flex-1 rounded",
                    steps[i + 1].done ? "bg-accent" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Akciók */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
          {!completed && isCreator && !delivered && (
            <Button
              size="sm"
              className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
              disabled={pending}
              onClick={() => run(() => markDelivered(c.id), "Munka leadva")}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
              {changesPending ? "Javított anyag leadása" : "Munka leadása"}
            </Button>
          )}
          {!completed && isCreator && delivered && (
            <span className="text-sm text-muted-foreground">
              Leadva — várakozás a márka jóváhagyására.
            </span>
          )}

          {!completed && isBrand && delivered && !showChange && (
            <>
              <Button
                size="sm"
                className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
                disabled={pending}
                onClick={() => run(() => markCompleted(c.id), "Jóváhagyva és lezárva")}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Jóváhagyás
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => setShowChange(true)}>
                <PencilLine className="h-4 w-4" /> Változtatást kérek
              </Button>
            </>
          )}
          {!completed && isBrand && !delivered && (
            <span className="text-sm text-muted-foreground">
              {changesPending
                ? "Változtatást kértél — várakozás az új leadásra."
                : "Várakozás a tartalomgyártó leadására."}
            </span>
          )}

          {completed && isBrand && !c.creatorReviewedByBrand && (
            <CreatorReviewModal collabId={c.id} creatorName={c.partnerName} />
          )}
          {completed && isBrand && c.creatorReviewedByBrand && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
              <Star className="h-4 w-4 fill-current" /> Értékelted a tartalomgyártót
            </span>
          )}
          {completed && isCreator && !c.brandReviewedByCreator && (
            <BrandReviewModal collabId={c.id} brandName={c.partnerName} />
          )}
          {completed && isCreator && c.brandReviewedByCreator && (
            <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
              <Star className="h-4 w-4 fill-current" /> Értékelted a márkát
            </span>
          )}
        </div>

        {/* Változtatás-kérés inline doboz */}
        {showChange && !completed && isBrand && (
          <div className="mt-3 space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-800">Mit kérsz másképp?</p>
            <Textarea
              value={changeNote}
              rows={3}
              maxLength={1000}
              placeholder="Írd le röviden, min változtasson a tartalomgyártó…"
              onChange={(e) => setChangeNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowChange(false)} disabled={pending}>
                Mégse
              </Button>
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  run(async () => {
                    const res = await requestChanges(c.id, changeNote);
                    if (!res.error) {
                      setShowChange(false);
                      setChangeNote("");
                    }
                    return res;
                  }, "Változtatás kérve")
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PencilLine className="h-4 w-4" />}
                Változtatás kérése
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Beszélgetés link */}
      <Link
        href={messagesHref}
        className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-accent/50"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
            <MessageSquare className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold">Beszélgetés megnyitása</span>
            <span className="block text-xs text-muted-foreground">
              Az üzenetváltás és az idővonal eseményei (leadás, módosítás, jóváhagyás) itt láthatók időrendben.
            </span>
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-[#4d7c0f]">Megnyitás →</span>
      </Link>
    </div>
  );
}
