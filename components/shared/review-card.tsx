import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatHuDate } from "@/lib/utils/format";

export type ReviewView = {
  id: string;
  overallRating: number;
  communicationRating: number;
  qualityRating: number;
  deadlineRating: number;
  text: string;
  createdAt: Date;
  brandName: string;
  brandLogo: string | null;
  responseText: string | null;
};

export function ReviewCard({ review }: { review: ReviewView }) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={review.brandLogo ?? undefined} />
            <AvatarFallback>{review.brandName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{review.brandName}</p>
            <p className="text-sm text-muted-foreground">{formatHuDate(review.createdAt)}</p>
          </div>
        </div>
        <RatingStars rating={review.overallRating} />
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">{review.text}</p>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Kommunikáció: {review.communicationRating}/5</span>
        <span>Minőség: {review.qualityRating}/5</span>
        <span>Határidő: {review.deadlineRating}/5</span>
      </div>

      {review.responseText && (
        <div className="mt-4 rounded-lg bg-muted p-3">
          <p className="text-xs font-semibold text-muted-foreground">Creator válasza:</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{review.responseText}</p>
        </div>
      )}
    </div>
  );
}
