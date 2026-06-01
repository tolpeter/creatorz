import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="grid gap-6 md:grid-cols-[260px_1fr]">
      <aside className="space-y-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </aside>
      <div>
        <Skeleton className="mb-4 h-9 w-48" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4">
              <Skeleton className="mb-4 h-16 w-16 rounded-full" />
              <Skeleton className="mb-2 h-6 w-32" />
              <Skeleton className="mb-4 h-4 w-24" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
