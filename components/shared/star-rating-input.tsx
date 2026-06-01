"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            aria-label={`${i} csillag`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                i <= (hover || value)
                  ? "fill-accent text-accent"
                  : "text-muted-foreground/40"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
