import { Skeleton } from "@/components/ui/skeleton";

export default function AdsLoading() {
  return (
    <div className="py-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="mt-2 h-4 w-40" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 sm:flex-row">
            <Skeleton className="aspect-[16/10] w-full shrink-0 rounded-xl sm:h-32 sm:w-44" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="hidden w-40 space-y-3 sm:block">
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
