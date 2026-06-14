"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  BrowseCreatorCard,
  type BrowseCard,
} from "@/components/creator/browse-creator-card";
import {
  loadMoreCreators,
  type BrowseFiltersInput,
} from "@/app/actions/browse";

export function CreatorsInfiniteGrid({
  initial,
  initialHasMore,
  filters,
  canSave = false,
}: {
  initial: BrowseCard[];
  initialHasMore: boolean;
  filters: BrowseFiltersInput;
  canSave?: boolean;
}) {
  const [items, setItems] = useState<BrowseCard[]>(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const initialCountRef = useRef(initial.length);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await loadMoreCreators(items.length, filters);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.hasMore);
    } finally {
      setLoading(false);
    }
  }, [items.length, loading, hasMore, filters]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchMore();
      },
      { rootMargin: "300px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore]);

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 bg-white p-12 text-center text-muted-foreground">
        Nincs a szűrőknek megfelelő tartalomgyártó.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((c, i) => {
          const isNew = i >= initialCountRef.current;
          return (
            <div
              key={c.username}
              className={isNew ? "animate-slide-up" : undefined}
              style={
                isNew
                  ? {
                      animationDelay: `${((i - initialCountRef.current) % 12) * 50}ms`,
                    }
                  : undefined
              }
            >
              <BrowseCreatorCard c={c} canSave={canSave} />
            </div>
          );
        })}
      </div>

      {/* Sentinel az IntersectionObserver-nek */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-8"
        >
          {loading && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Több tartalomgyártó betöltése…
            </span>
          )}
        </div>
      )}
    </>
  );
}
