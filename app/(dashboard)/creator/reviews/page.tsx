import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviews, reviewResponses, brandProfiles } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/shared/rating-stars";
import { RatingDistribution } from "@/components/shared/rating-distribution";
import { ReviewCard, type ReviewView } from "@/components/shared/review-card";
import { ReviewActions } from "@/components/creator/review-actions";

export const metadata = { title: "Értékelések" };

export default async function CreatorReviewsPage() {
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const rows = await db
    .select({
      id: reviews.id,
      overallRating: reviews.overallRating,
      communicationRating: reviews.communicationRating,
      qualityRating: reviews.qualityRating,
      deadlineRating: reviews.deadlineRating,
      text: reviews.text,
      createdAt: reviews.createdAt,
      reported: reviews.reported,
      hidden: reviews.hidden,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
      responseText: reviewResponses.text,
    })
    .from(reviews)
    .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
    .leftJoin(reviewResponses, eq(reviewResponses.reviewId, reviews.id))
    .where(eq(reviews.creatorId, creator.profile.id))
    .orderBy(desc(reviews.createdAt));

  const visible = rows.filter((r) => !r.hidden);
  const avg = creator.profile.averageRating;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Értékelések</h1>

      {visible.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          Még nincs értékelésed. Elfogadott együttműködés után a márka 7 nappal
          később kap egy értékelő linket (Modell A).
        </div>
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-6 pt-6 sm:grid-cols-[auto_1fr]">
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{avg ?? "—"}</span>
                <RatingStars rating={Number(avg ?? 0)} />
                <span className="mt-1 text-sm text-muted-foreground">
                  {creator.profile.reviewCount} értékelés
                </span>
              </div>
              <RatingDistribution reviews={visible} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            {visible.map((r) => {
              const view: ReviewView = {
                id: r.id,
                overallRating: r.overallRating,
                communicationRating: r.communicationRating,
                qualityRating: r.qualityRating,
                deadlineRating: r.deadlineRating,
                text: r.text,
                createdAt: r.createdAt,
                brandName: r.brandName,
                brandLogo: r.brandLogo,
                responseText: r.responseText,
              };
              return (
                <div key={r.id}>
                  <ReviewCard review={view} />
                  <ReviewActions
                    reviewId={r.id}
                    hasResponse={!!r.responseText}
                    reported={r.reported}
                  />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
