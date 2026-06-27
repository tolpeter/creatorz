import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, brandProfiles, creatorProfiles } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatHuDate } from "@/lib/utils/format";

export const metadata = { title: "Admin — Értékelések" };

export default async function AdminReviewsPage() {
  const rows = await db
    .select({
      id: reviews.id,
      text: reviews.text,
      overallRating: reviews.overallRating,
      hidden: reviews.hidden,
      reported: reviews.reported,
      createdAt: reviews.createdAt,
      brandName: brandProfiles.companyName,
      creatorName: creatorProfiles.displayName,
    })
    .from(reviews)
    .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, reviews.creatorId))
    .orderBy(desc(reviews.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Értékelések"
        icon={Star}
        description={`${rows.length} értékelés`}
      />
      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs értékelés.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm">
                    <strong>{r.brandName}</strong> → {r.creatorName} · {formatHuDate(r.createdAt)}
                    {r.hidden && <Badge className="ml-2 bg-muted text-muted-foreground">Rejtett</Badge>}
                    {r.reported && <Badge className="ml-2 bg-destructive/15 text-destructive">Bejelentve</Badge>}
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
