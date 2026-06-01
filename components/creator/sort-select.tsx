"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "featured", label: "Kiemelt" },
  { value: "newest", label: "Legújabb" },
  { value: "rating", label: "Legjobb értékelés" },
];

export function SortSelect() {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get("sort") ?? "featured";

  function onChange(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === "featured") params.delete("sort");
    else params.set("sort", value);
    router.push(`/creators?${params.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
