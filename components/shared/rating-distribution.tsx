export function RatingDistribution({
  reviews,
}: {
  reviews: Array<{ overallRating: number }>;
}) {
  const total = reviews.length;
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.overallRating === star).length,
  }));

  return (
    <div className="space-y-1">
      {counts.map(({ star, count }) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={star} className="flex items-center gap-2 text-sm">
            <span className="w-6">{star}★</span>
            <div className="h-2 flex-1 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
