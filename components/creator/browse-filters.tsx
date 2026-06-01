"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { CREATOR_CATEGORIES, HUNGARIAN_COUNTIES, LANGUAGES, GENDER_OPTIONS } from "@/lib/constants";

export function BrowseFilters() {
  const router = useRouter();
  const sp = useSearchParams();

  const [search, setSearch] = useState(sp.get("search") ?? "");
  const [categories, setCategories] = useState<string[]>(
    sp.get("categories") ? sp.get("categories")!.split(",").filter(Boolean) : []
  );
  const [languages, setLanguages] = useState<string[]>(
    sp.get("languages") ? sp.get("languages")!.split(",").filter(Boolean) : []
  );
  const [county, setCounty] = useState(sp.get("county") ?? "");
  const [city, setCity] = useState(sp.get("city") ?? "");
  const [gender, setGender] = useState(sp.get("gender") ?? "");
  const [minAge, setMinAge] = useState(sp.get("minAge") ?? "");
  const [maxAge, setMaxAge] = useState(sp.get("maxAge") ?? "");
  const [minIg, setMinIg] = useState(sp.get("minInstagramFollowers") ?? "");
  const [minTt, setMinTt] = useState(sp.get("minTiktokFollowers") ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(sp.get("verifiedOnly") === "1");
  const [minRating, setMinRating] = useState(sp.get("minRating") ?? "");

  function apply() {
    const params = new URLSearchParams();
    // megőrizzük a rendezést
    const sort = sp.get("sort");
    if (sort) params.set("sort", sort);

    if (search.trim()) params.set("search", search.trim());
    if (categories.length) params.set("categories", categories.join(","));
    if (languages.length) params.set("languages", languages.join(","));
    if (county) params.set("county", county);
    if (city.trim()) params.set("city", city.trim());
    if (gender) params.set("gender", gender);
    if (minAge) params.set("minAge", minAge);
    if (maxAge) params.set("maxAge", maxAge);
    if (minIg) params.set("minInstagramFollowers", minIg);
    if (minTt) params.set("minTiktokFollowers", minTt);
    if (verifiedOnly) params.set("verifiedOnly", "1");
    if (minRating) params.set("minRating", minRating);

    router.push(`/creators?${params.toString()}`);
  }

  function reset() {
    setSearch("");
    setCategories([]);
    setLanguages([]);
    setCounty("");
    setCity("");
    setGender("");
    setMinAge("");
    setMaxAge("");
    setMinIg("");
    setMinTt("");
    setVerifiedOnly(false);
    setMinRating("");
    router.push("/creators");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label>Keresés</Label>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="Név, város…"
        />
      </div>

      <div className="space-y-2">
        <Label>Kategóriák</Label>
        <ChipMultiSelect options={CREATOR_CATEGORIES} value={categories} onChange={setCategories} />
      </div>

      <div className="space-y-2">
        <Label>Nyelvek</Label>
        <ChipMultiSelect options={LANGUAGES} value={languages} onChange={setLanguages} />
      </div>

      <div className="space-y-1.5">
        <Label>Megye</Label>
        <Select value={county || "all"} onValueChange={(v) => setCounty(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Összes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Összes megye</SelectItem>
            {HUNGARIAN_COUNTIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Város</Label>
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="pl. Budapest" />
      </div>

      <div className="space-y-1.5">
        <Label>Nem</Label>
        <Select value={gender || "all"} onValueChange={(v) => setGender(v === "all" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Mindegy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Mindegy</SelectItem>
            {GENDER_OPTIONS.map((g) => (
              <SelectItem key={g.value} value={g.value}>
                {g.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Kor min.</Label>
          <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Kor max.</Label>
          <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Min. Instagram követő</Label>
        <Input type="number" value={minIg} onChange={(e) => setMinIg(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Min. TikTok követő</Label>
        <Input type="number" value={minTt} onChange={(e) => setMinTt(e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Min. értékelés</Label>
        <Select value={minRating || "any"} onValueChange={(v) => setMinRating(v === "any" ? "" : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Bármilyen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Bármilyen</SelectItem>
            {[4, 3, 2].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r}★ és felette
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="verifiedOnly">Csak verifikált</Label>
        <Switch id="verifiedOnly" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
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
