import "server-only";
import OpenAI from "openai";
import { CREATOR_CATEGORIES, LANGUAGES, COLLABORATION_TYPES } from "@/lib/constants";

/**
 * OpenAI text-embedding-3-small (1536 dim) — olcsó, gyors szemantikus
 * vektor a hirdetés↔tartalomgyártó AI-párosításhoz.
 * Költség: ~$0.00002 / 1k token.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || !text.trim()) return null;
  try {
    const client = new OpenAI({ apiKey });
    const res = await client.embeddings.create({
      model: "text-embedding-3-small",
      input: text.slice(0, 8000),
    });
    const v = res.data[0]?.embedding;
    return Array.isArray(v) && v.length > 0 ? v : null;
  } catch (err) {
    console.error("[ai] embedText failed:", (err as Error).message);
    return null;
  }
}

/** Koszinusz-hasonlóság két azonos hosszú vektor között (−1..1). */
export function cosineSim(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function catLabels(values: string[] | null | undefined): string {
  return (values ?? [])
    .map((v) => CREATOR_CATEGORIES.find((c) => c.value === v)?.label ?? v)
    .join(", ");
}
function langLabels(values: string[] | null | undefined): string {
  return (values ?? [])
    .map((v) => LANGUAGES.find((l) => l.value === v)?.label ?? v)
    .join(", ");
}

/** A creator-profil szöveges lenyomata az embeddinghez. */
export function creatorEmbeddingText(p: {
  displayName: string;
  bio: string | null;
  categories: string[] | null;
  city: string | null;
  county: string | null;
  languages: string[] | null;
  profileKind?: string | null;
  professionalRoles?: string[] | null;
  specialties?: string[] | null;
}): string {
  const parts = [
    `Tartalomgyártó: ${p.displayName}`,
    p.categories?.length ? `Kategóriák: ${catLabels(p.categories)}` : "",
    [p.city, p.county].filter(Boolean).join(", ") ? `Helyszín: ${[p.city, p.county].filter(Boolean).join(", ")}` : "",
    p.languages?.length ? `Nyelvek: ${langLabels(p.languages)}` : "",
    p.profileKind === "professional" && p.professionalRoles?.length
      ? `Szakember: ${p.professionalRoles.join(", ")}`
      : "",
    p.specialties?.length ? `Szakterület: ${p.specialties.join(", ")}` : "",
    p.bio ? `Bemutatkozás: ${p.bio}` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

/** A hirdetés szöveges lenyomata az embeddinghez. */
export function adEmbeddingText(a: {
  title: string;
  description: string;
  categories: string[] | null;
  collaborationType?: string | null;
  location?: string | null;
}): string {
  const collab = a.collaborationType
    ? COLLABORATION_TYPES.find((c) => c.value === a.collaborationType)?.label ?? a.collaborationType
    : "";
  const parts = [
    `Hirdetés: ${a.title}`,
    a.categories?.length ? `Kategóriák: ${catLabels(a.categories)}` : "",
    collab ? `Együttműködés: ${collab}` : "",
    a.location ? `Helyszín: ${a.location}` : "",
    `Leírás: ${a.description}`,
  ];
  return parts.filter(Boolean).join("\n");
}
