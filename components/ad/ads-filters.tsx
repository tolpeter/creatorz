"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import {
  CREATOR_CATEGORIES,
  CONTENT_TYPES,
  USAGE_RIGHTS,
  COLLABORATION_TYPES,
} from "@/lib/constants";

export function AdsFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [categories, setCategories] = useState<string[]>(
    sp.get("categories")?.split(",").filter(Boolean) ?? []
  );
  const [contentType, setContentType] = useState(sp.get("contentType") ?? "");
  const [collaborationType, setCollaborationType] = useState(
    sp.get("collaborationType") ?? ""
  );
  const [usageRights, setUsageRights] = useState(sp.get("usageRights") ?? "");
  const [deadline, setDeadline] = useState(sp.get("deadline") ?? "");
  const [location, setLocation] = useState(sp.get("location") ?? "");
  const [minBudget, setMinBudget] = useState(sp.get("minBudget") ?? "");

  function apply() {
    const params = new URLSearchParams();
    const sort = sp.get("sort");
    if (sort) params.set("sort", sort);
    if (categories.length) params.set("categories", categories.join(","));
    if (contentType) params.set("contentType", contentType);
    if (collaborationType) params.set("collaborationType", collaborationType);
    if (usageRights) params.set("usageRights", usageRights);
    if (deadline) params.set("deadline", deadline);
    if (location.trim()) params.set("location", location.trim());
    if (minBudget) params.set("minBudget", minBudget);
    router.push(`/ads?${params.toString()}`);
  }

  function reset() {
    setCategories([]);
    setContentType("");
    setCollaborationType("");
    setUsageRights("");
    setDeadline("");
    setLocation("");
    setMinBudget("");
    router.push("/ads");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Kategóriák</Label>
        <ChipMultiSelect options={CREATOR_CATEGORIES} value={categories} onChange={setCategories} />
      </div>
      <div className="space-y-1.5">
        <Label>Tartalom típusa</Label>
        <Select value={contentType || "all"} onValueChange={(v) => setContentType(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Mindegy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mindegy</SelectItem>
            {CONTENT_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Együttműködés típusa</Label>
        <Select value={collaborationType || "all"} onValueChange={(v) => setCollaborationType(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Mindegy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mindegy</SelectItem>
            {COLLABORATION_TYPES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Felhasználási jog</Label>
        <Select value={usageRights || "all"} onValueChange={(v) => setUsageRights(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Mindegy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mindegy</SelectItem>
            {USAGE_RIGHTS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Határidő</Label>
        <Select value={deadline || "all"} onValueChange={(v) => setDeadline(v === "all" ? "" : v)}>
          <SelectTrigger><SelectValue placeholder="Mindegy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mindegy</SelectItem>
            <SelectItem value="week">Eheti</SelectItem>
            <SelectItem value="month">Ehavi</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Lokáció</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="pl. Budapest" />
      </div>
      <div className="space-y-1.5">
        <Label>Min. költségvetés (Ft)</Label>
        <Input type="number" value={minBudget} onChange={(e) => setMinBudget(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={apply} className="flex-1">
          <Filter className="h-4 w-4" /> Szűrés
        </Button>
        <Button onClick={reset} variant="outline">
          <X className="h-4 w-4" /> Törlés
        </Button>
      </div>
    </div>
  );
}
