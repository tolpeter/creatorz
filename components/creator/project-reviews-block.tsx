import Link from "next/link";
import { Star, Users2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicProjectReview } from "@/app/actions/creator-projects";

const fmt = (d: Date | string) =>
  new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));

/** Nyilvános, alkotótársi (közös projekt) értékelések a profilon. */
export function ProjectReviewsBlock({ reviews }: { reviews: PublicProjectReview[] }) {
  if (reviews.length === 0) return null;
  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <Users2 className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-black">Alkotótársak értékelései</h2>
          <p className="text-xs text-muted-foreground">Közös projektek után más alkotóktól.</p>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r, i) => (
          <div key={i} className="rounded-2xl border border-black/10 bg-[#f6f7f2] p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href={`/creators/${r.reviewerUsername}`} className="flex min-w-0 items-center gap-2 hover:underline">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={r.reviewerAvatar ?? undefined} />
                  <AvatarFallback>{r.reviewerName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="truncate text-sm font-semibold">{r.reviewerName}</span>
              </Link>
              <span className="flex shrink-0 items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={n <= r.overallRating ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4 text-muted-foreground/40"}
                  />
                ))}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-foreground/90">{r.text}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{fmt(r.createdAt)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
