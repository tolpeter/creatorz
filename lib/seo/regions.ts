import { HUNGARIAN_COUNTIES } from "@/lib/constants";

/** Ékezet- és szóköz-mentes slug (pl. "Győr-Moson-Sopron" → "gyor-moson-sopron"). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ékezetek le
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A megye-slug → eredeti megyenév (a HUNGARIAN_COUNTIES listából). */
export function countyFromSlug(slug: string): string | null {
  return HUNGARIAN_COUNTIES.find((c) => slugify(c) === slug) ?? null;
}

export const COUNTY_SLUGS = HUNGARIAN_COUNTIES.map((c) => ({ county: c, slug: slugify(c) }));
