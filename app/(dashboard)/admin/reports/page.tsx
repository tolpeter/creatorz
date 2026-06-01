import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, brandProfiles, creatorProfiles } from "@/lib/db/schema";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Bejelentések" };

export default async function AdminReportsPage() {
  const rows = await db
    .select({
      id: reviews.id,
      text: reviews.text,
      overallRating: reviews.overallRating,
      hidden: reviews.hidden,
      createdAt: reviews.createdAt,
      brandName: brandProfiles.companyName,
      creatorName: creatorProfiles.displayName,
    })
    .from(reviews)
    .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, reviews.creatorId))
    .where(eq(reviews.reported, true))
    .orderBy(desc(reviews.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bejelentések</h1>
        <p className="text-muted-foreground">{rows.length} bejelentett értékelés</p>
      </div>
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Nincs bejelentett tartalom.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <strong>{r.brandName}</strong> → {r.creatorName} ·{" "}
                    {formatHuDate(r.createdAt)}
                  </p>
                  <RatingStars rating={r.overallRating} />
                </div>
                <ReviewModerationActions reviewId={r.id} hidden={r.hidden} />
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
