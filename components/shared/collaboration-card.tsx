"use client";

import { useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Check, Loader2, Package, CheckCircle2, MessageSquare, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markDelivered, markCompleted, type CollabItem } from "@/app/actions/collaborations";
import { BrandReviewModal } from "@/components/shared/brand-review-modal";

function fmt(d: Date | string | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));
}

export function CollaborationCard({ c }: { c: CollabItem }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  // A korábbi review-folyamat státuszait is figyelembe vesszük:
  // reviewed/closed = lezárt, review_pending = leadott.
  const completed = !!c.completedAt || c.status === "closed" || c.status === "reviewed";
  const delivered = !!c.deliveredAt || completed || c.status === "review_pending";
  const isCreator = c.viewerRole === "creator";

  const steps = [
    { label: "Elfogadva", date: fmt(c.acceptedAt), done: true },
    { label: "Leadva", date: fmt(c.deliveredAt), done: delivered },
    { label: "Lezárva", date: fmt(c.completedAt), done: completed },
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

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={c.partnerAvatar ?? undefined} />
            <AvatarFallback>{c.partnerName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold">{c.partnerName}</p>
            <p className="truncate text-sm text-muted-foreground">{c.adTitle}</p>
          </div>
        </div>
        {completed ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f0f4e5] px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <CheckCircle2 className="h-3.5 w-3.5" /> Lezárva
          </span>
        ) : (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-bold text-[#3f6212]">
            <Clock className="h-3.5 w-3.5" /> Folyamatban
          </span>
        )}
      </div>

      {/* Idővonal */}
      <div className="mt-5 flex items-center">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2",
                  s.done
                    ? "border-accent bg-accent text-black"
                    : "border-muted bg-background text-muted-foreground",
                )}
              >
                {s.done ? <Check className="h-4 w-4" /> : <span className="text-xs">{i + 1}</span>}
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
        <Button asChild variant="outline" size="sm">
          <Link href={isCreator ? "/creator/messages" : "/brand/messages"}>
            <MessageSquare className="h-4 w-4" /> Üzenetek
          </Link>
        </Button>

        {!completed && isCreator && !delivered && (
          <Button
            size="sm"
            className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
            disabled={pending}
            onClick={() => run(() => markDelivered(c.id), "Munka leadva")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />}
            Munka leadása
          </Button>
        )}
        {!completed && isCreator && delivered && (
          <span className="text-sm text-muted-foreground">Leadva — várakozás a márka lezárására.</span>
        )}

        {!completed && !isCreator && delivered && (
          <Button
            size="sm"
            className="bg-accent font-bold text-black hover:bg-black hover:text-accent"
            disabled={pending}
            onClick={() => run(() => markCompleted(c.id), "Együttműködés lezárva")}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Együttműködés lezárása
          </Button>
        )}
        {!completed && !isCreator && !delivered && (
          <span className="text-sm text-muted-foreground">Várakozás a tartalomgyártó leadására.</span>
        )}

        {completed && isCreator && !c.brandReviewed && (
          <BrandReviewModal collabId={c.id} brandName={c.partnerName} />
        )}
        {completed && isCreator && c.brandReviewed && (
          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#4d7c0f]">
            <CheckCircle2 className="h-4 w-4" /> Értékelted a márkát
          </span>
        )}
      </div>
    </div>
  );
}
