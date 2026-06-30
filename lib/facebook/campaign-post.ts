import "server-only";
import OpenAI from "openai";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { postToFacebookPage } from "./post";
import { formatHuDate, formatBudgetRange } from "@/lib/utils/format";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.creatorz.hu";

const TARGET_LABELS: Record<string, string> = {
  ugc: "UGC tartalomgyártó",
  influencer: "influenszer",
  model: "modell",
  editor: "videóvágó",
  photographer: "fotós",
  videographer: "operatőr",
};
const COLLAB_LABELS: Record<string, string> = {
  project: "Projekt alapú",
  longterm: "Hosszú távú együttműködés",
  barter: "Barter",
};

const CTA_LINE = "Részletek és jelentkezés az alábbi linken lehetséges:";

type CampaignInfo = {
  title: string;
  description: string;
  brand: string | null; // null = anonim
  targets: string;
  collab: string | null;
  budget: string | null;
  deadline: string | null;
};

/** AI-szöveg a megadott minták stílusában (link NÉLKÜL — azt mi fűzzük hozzá). */
async function generatePostText(info: CampaignInfo): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const client = new OpenAI({ apiKey });
    const system =
      "Magyar közösségimédia-szövegíró vagy a Creatorz.hu alkotói piactérnek. " +
      "Írj RÖVID, lelkes Facebook-poszt szöveget egy új kampányról, amire alkotók pályázhatnak. " +
      "Stílus (kövesd pontosan): 1) első sor figyelemfelkeltő mondat 1-2 emojival, megnevezve kit keresnek; " +
      "2) 1-2 mondat a kampányról/márkáról; 3) ha van, külön sorban 'Bérezés: ...' és 'Jelentkezési határidő: ...'. " +
      "NE írj hashtaget, NE írj linket, NE tedd bele a CTA-mondatot. Max 4-5 sor. Csak a szöveget add vissza.";
    const lines = [
      `Kampány címe: ${info.title}`,
      info.brand ? `Márka: ${info.brand}` : "Márka: (bizalmas, ne nevezd meg)",
      `Keresett alkotók: ${info.targets}`,
      info.collab ? `Együttműködés: ${info.collab}` : "",
      info.budget ? `Bérezés: ${info.budget}` : "Bérezés: Megegyezés szerint",
      info.deadline ? `Jelentkezési határidő: ${info.deadline}` : "",
      `Leírás: ${info.description.slice(0, 500)}`,
    ].filter(Boolean);
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 220,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: lines.join("\n") },
      ],
    });
    return res.choices[0]?.message?.content?.trim() || null;
  } catch (err) {
    console.error("[fb] generatePostText failed:", (err as Error).message);
    return null;
  }
}

/** Determinisztikus sablon, ha az AI nem elérhető. */
function templatePostText(info: CampaignInfo): string {
  const who = info.brand ? `${info.brand}` : "Egy bizalmas márka";
  const parts: string[] = [];
  parts.push(`${info.targets} keresünk – csatlakozz a Creatorz-on! ✨`);
  parts.push(`${who} új kampányt indított: „${info.title}”.`);
  if (info.budget) parts.push(`Bérezés: ${info.budget}`);
  else parts.push("Bérezés: Megegyezés szerint");
  if (info.deadline) parts.push(`Jelentkezési határidő: ${info.deadline}`);
  return parts.join("\n");
}

/**
 * Egy jóváhagyott kampányt kiposztol a Creatorz Facebook-oldalra.
 * Best-effort: a hívó (approveAd) sosem akad meg, ha ez hibázik.
 */
export async function autoPostCampaignToFacebook(
  adId: string,
): Promise<{ posted: boolean; error?: string }> {
  const [row] = await db
    .select({
      title: ads.title,
      slug: ads.slug,
      description: ads.description,
      anonymous: ads.anonymous,
      targetKinds: ads.targetKinds,
      collaborationType: ads.collaborationType,
      budgetMinHuf: ads.budgetMinHuf,
      budgetMaxHuf: ads.budgetMaxHuf,
      budgetPublic: ads.budgetPublic,
      deadline: ads.deadline,
      coverUrl: ads.coverUrl,
      brandName: brandProfiles.companyName,
    })
    .from(ads)
    .leftJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, adId))
    .limit(1);
  if (!row) return { posted: false, error: "A kampány nem található" };

  const info: CampaignInfo = {
    title: row.title,
    description: row.description ?? "",
    brand: row.anonymous ? null : row.brandName ?? null,
    targets: (row.targetKinds ?? ["ugc"]).map((t) => TARGET_LABELS[t] ?? t).join(", "),
    collab: COLLAB_LABELS[row.collaborationType] ?? null,
    budget:
      row.budgetPublic && row.budgetMinHuf
        ? formatBudgetRange(row.budgetMinHuf, row.budgetMaxHuf)
        : null,
    deadline: row.deadline ? formatHuDate(row.deadline) : null,
  };

  const body = (await generatePostText(info)) || templatePostText(info);
  const link = `${APP_URL}/ads/${row.slug ?? adId}`;
  const message = `${body}\n\n${CTA_LINE}`;

  return postToFacebookPage({ message, link, imageUrl: row.coverUrl });
}
