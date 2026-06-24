import Link from "next/link";
import { Check, CheckCircle2, Clock, PencilLine, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type CollabItem } from "@/app/actions/collaborations";

function fmt(d: Date | string | null) {
  if (!d) return null;
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));
}

export function CollaborationCard({ c }: { c: CollabItem }) {
  const completed = !!c.completedAt || c.status === "closed";
  const inReview = !completed && c.status === "review_pending";
  const delivered = !!c.deliveredAt || completed || inReview;
  const isCreator = c.viewerRole === "creator";
  const href = `/${isCreator ? "creator" : "brand"}/collaborations/${c.id}`;

  const steps = [
    { label: "Elfogadva", date: fmt(c.acceptedAt), done: true },
    { label: "Leadva", date: fmt(c.deliveredAt), done: delivered },
    { label: "Lezárva", date: fmt(c.completedAt), done: completed },
  ];

  return (
    <Link
      href={href}
      className="group block rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-md"
    >
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
        ) : inReview ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Értékelésre vár
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

      <div className="mt-4 flex items-center justify-between border-t pt-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <PencilLine className="h-4 w-4" /> Chat, leadás és jóváhagyás
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#4d7c0f] group-hover:gap-1.5">
          Megnyitás <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
