import { redirect } from "next/navigation";
import { desc, eq, and } from "drizzle-orm";
import { Star, MessageSquareQuote } from "lucide-react";
import { db } from "@/lib/db";
import { brandReviews, creatorProfiles } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const metadata = { title: "Értékeléseim" };

function fmt(d: Date | null) {
  if (!d) return "";
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(new Date(d));
}

function Stars({ n }: { n: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= n ? "h-4 w-4 fill-accent text-accent" : "h-4 w-4 text-muted-foreground/30"}
        />
      ))}
    </span>
  );
}

export default async function BrandReviewsPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const rows = await db
    .select({
      id: brandReviews.id,
      overallRating: brandReviews.overallRating,
      communicationRating: brandReviews.communicationRating,
      fairnessRating: brandReviews.fairnessRating,
      clarityRating: brandReviews.clarityRating,
      text: brandReviews.text,
      createdAt: brandReviews.createdAt,
      creatorName: creatorProfiles.displayName,
      creatorAvatar: creatorProfiles.avatarUrl,
    })
    .from(brandReviews)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, brandReviews.creatorId))
    .where(and(eq(brandReviews.brandId, brand.profile.id), eq(brandReviews.hidden, false)))
    .orderBy(desc(brandReviews.createdAt));

  const avg = brand.profile.averageRating;
  const count = brand.profile.reviewCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Értékeléseim</h1>
        <p className="text-muted-foreground">Amit a tartalomgyártók írtak rólatok.</p>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <div className="text-center">
          <p className="text-4xl font-black text-[#3f6212]">{avg ?? "—"}</p>
          <Stars n={Math.round(Number(avg) || 0)} />
        </div>
        <div className="text-sm text-muted-foreground">
          {count > 0
            ? `${count} értékelés alapján`
            : "Még nincs értékelésetek. Egy lezárt együttműködés után a tartalomgyártók értékelhetnek."}
        </div>
      </div>

      {rows.length > 0 && (
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.creatorAvatar ?? undefined} />
                    <AvatarFallback>{r.creatorName.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{r.creatorName}</p>
                    <p className="text-xs text-muted-foreground">{fmt(r.createdAt)}</p>
                  </div>
                </div>
                <Stars n={r.overallRating} />
              </div>
              <p className="mt-3 flex gap-2 text-sm leading-6">
                <MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                {r.text}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>Kommunikáció: {r.communicationRating}/5</span>
                <span>Korrektség: {r.fairnessRating}/5</span>
                <span>Brief: {r.clarityRating}/5</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
