"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Filter, X, Search as SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  HUNGARIAN_COUNTIES,
  LANGUAGES,
  GENDER_OPTIONS,
} from "@/lib/constants";

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
    <div className="space-y-1.5 text-sm">
      {/* Keresés */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Keresés</label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Név, város, kulcsszó…"
            className="h-7 pl-7 text-xs"
          />
        </div>
      </div>

      {/* Kategóriák */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Kategóriák</label>
        <ChipMultiSelect
          compact
          options={CREATOR_CATEGORIES}
          value={categories}
          onChange={setCategories}
        />
      </div>

      {/* Nyelvek */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-muted-foreground">Nyelvek</label>
        <ChipMultiSelect compact options={LANGUAGES} value={languages} onChange={setLanguages} />
      </div>

      {/* Megye */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Megye</label>
        <Select value={county || "all"} onValueChange={(v) => setCounty(v === "all" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Összes megye" />
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

      {/* Város */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Város</label>
        <Input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="pl. Budapest"
          className="h-7 text-xs"
        />
      </div>

      {/* Nem */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Nem</label>
        <Select value={gender || "all"} onValueChange={(v) => setGender(v === "all" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs">
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

      {/* Kor (év) – két oszlop */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Kor (év)</label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            value={minAge}
            onChange={(e) => setMinAge(e.target.value)}
            placeholder="Kor min."
            className="h-7 text-xs"
          />
          <Input
            type="number"
            value={maxAge}
            onChange={(e) => setMaxAge(e.target.value)}
            placeholder="Kor max."
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Min IG / TikTok – két oszlop */}
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Min. Instagram követő
          </label>
          <Input
            type="number"
            value={minIg}
            onChange={(e) => setMinIg(e.target.value)}
            placeholder="pl. 10 000"
            className="h-7 text-xs"
          />
        </div>
        <div className="space-y-0.5">
          <label className="text-xs font-semibold text-muted-foreground">
            Min. TikTok követő
          </label>
          <Input
            type="number"
            value={minTt}
            onChange={(e) => setMinTt(e.target.value)}
            placeholder="pl. 20 000"
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Min értékelés */}
      <div className="space-y-0.5">
        <label className="text-xs font-semibold text-muted-foreground">Min. értékelés</label>
        <Select value={minRating || "any"} onValueChange={(v) => setMinRating(v === "any" ? "" : v)}>
          <SelectTrigger className="h-7 text-xs">
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

      {/* Verifikált toggle */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs font-medium">Csak verifikált profilok</span>
        <Switch checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
      </div>

      {/* Gombok */}
      <div className="flex gap-2 pt-1">
        <Button onClick={apply} className="h-8 flex-1 text-sm font-semibold">
          <Filter className="h-3.5 w-3.5" /> Szűrés
        </Button>
        <Button onClick={reset} variant="outline" className="h-8 text-sm">
          <X className="h-3.5 w-3.5" /> Törlés
        </Button>
      </div>
    </div>
  );
}
