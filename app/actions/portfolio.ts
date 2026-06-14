"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { portfolioItems } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/auth";
import { createAdminClient, storagePathFromPublicUrl } from "@/lib/supabase/admin";
import { MAX_PORTFOLIO_ITEMS } from "@/lib/constants";

const addSchema = z.object({
  type: z.enum(["video", "photo"]),
  url: z.string().min(1),
  thumbnailUrl: z.string().optional().nullable(),
  title: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  categories: z.array(z.string()).max(3).default([]),
});

export async function addPortfolioItem(input: z.input<typeof addSchema>) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id));
  if ((countRows[0]?.n ?? 0) >= MAX_PORTFOLIO_ITEMS) {
    return { error: `Legfeljebb ${MAX_PORTFOLIO_ITEMS} portfolio elem tölthető fel` };
  }

  const maxOrder = await db
    .select({ m: sql<number>`coalesce(max(${portfolioItems.sortOrder}), -1)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id));

  const inserted = await db
    .insert(portfolioItems)
    .values({
      creatorId: creator.profile.id,
      type: parsed.data.type,
      url: parsed.data.url,
      thumbnailUrl: parsed.data.thumbnailUrl || null,
      title: parsed.data.title || null,
      description: parsed.data.description || null,
      categories: parsed.data.categories,
      sortOrder: (maxOrder[0]?.m ?? -1) + 1,
    })
    .returning({ id: portfolioItems.id });

  revalidatePath("/creator/portfolio");
  return { success: true, id: inserted[0]?.id };
}

// ---------- Videó-link hozzáadása (TikTok / YouTube) oEmbed előképpel ----------
const videoLinkSchema = z.object({
  url: z.string().url("Adj meg egy érvényes linket").max(600),
});

/**
 * A creator beilleszti a TikTok (vagy YouTube) videó linkjét; az oEmbed-ből
 * behúzzuk az előképet (thumbnail) + címet, és portfolió-elemként mentjük.
 */
export async function addVideoLink(input: z.input<typeof videoLinkSchema>) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = videoLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen link" };
  }
  const url = parsed.data.url.trim();
  const isTikTok = /tiktok\.com/i.test(url);
  const isYouTube = /youtube\.com|youtu\.be/i.test(url);
  if (!isTikTok && !isYouTube) {
    return { error: "Csak TikTok vagy YouTube videó linkje adható meg." };
  }

  const countRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id));
  if ((countRows[0]?.n ?? 0) >= MAX_PORTFOLIO_ITEMS) {
    return { error: `Legfeljebb ${MAX_PORTFOLIO_ITEMS} portfolió elem lehet.` };
  }

  // oEmbed lekérés (előkép + cím)
  let thumbnailUrl: string | null = null;
  let title: string | null = null;
  try {
    const oembed = isTikTok
      ? `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
      : `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(oembed, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (res.ok) {
      const data = (await res.json()) as {
        thumbnail_url?: string;
        title?: string;
      };
      thumbnailUrl = data.thumbnail_url ?? null;
      title = data.title ?? null;
    }
  } catch {
    /* előkép nélkül is mentjük */
  }

  const maxOrder = await db
    .select({ m: sql<number>`coalesce(max(${portfolioItems.sortOrder}), -1)::int` })
    .from(portfolioItems)
    .where(eq(portfolioItems.creatorId, creator.profile.id));

  const inserted = await db
    .insert(portfolioItems)
    .values({
      creatorId: creator.profile.id,
      type: "video",
      url,
      thumbnailUrl,
      title: title?.slice(0, 200) ?? null,
      sortOrder: (maxOrder[0]?.m ?? -1) + 1,
    })
    .returning({ id: portfolioItems.id });

  revalidatePath("/creator/portfolio");
  return { success: true, id: inserted[0]?.id, thumbnailUrl, title };
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
  categories: z.array(z.string()).max(3).optional(),
});

export async function updatePortfolioItem(input: z.input<typeof updateSchema>) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };

  const set: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) set.title = parsed.data.title || null;
  if (parsed.data.description !== undefined)
    set.description = parsed.data.description || null;
  if (parsed.data.categories !== undefined) set.categories = parsed.data.categories;

  await db
    .update(portfolioItems)
    .set(set)
    .where(
      and(
        eq(portfolioItems.id, parsed.data.id),
        eq(portfolioItems.creatorId, creator.profile.id)
      )
    );

  revalidatePath("/creator/portfolio");
  return { success: true };
}

export async function deletePortfolioItem(id: string) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const rows = await db
    .select({ url: portfolioItems.url, thumbnailUrl: portfolioItems.thumbnailUrl })
    .from(portfolioItems)
    .where(and(eq(portfolioItems.id, id), eq(portfolioItems.creatorId, creator.profile.id)))
    .limit(1);

  if (!rows[0]) return { error: "Nem található elem" };

  await db
    .delete(portfolioItems)
    .where(and(eq(portfolioItems.id, id), eq(portfolioItems.creatorId, creator.profile.id)));

  // Storage takarítás (best-effort)
  try {
    const admin = createAdminClient();
    const paths = [rows[0].url, rows[0].thumbnailUrl]
      .filter((u): u is string => !!u)
      .map((u) => storagePathFromPublicUrl(u, "portfolio"))
      .filter((p): p is string => !!p);
    if (paths.length) await admin.storage.from("portfolio").remove(paths);
  } catch {
    // ignoráljuk — az adatbázis sor már törölve
  }

  revalidatePath("/creator/portfolio");
  return { success: true };
}

export async function reorderPortfolio(orderedIds: string[]) {
  const creator = await getCurrentCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const ids = z.array(z.string().uuid()).safeParse(orderedIds);
  if (!ids.success) return { error: "Érvénytelen sorrend" };

  await db.transaction(async (tx) => {
    for (let i = 0; i < ids.data.length; i++) {
      await tx
        .update(portfolioItems)
        .set({ sortOrder: i })
        .where(
          and(
            eq(portfolioItems.id, ids.data[i]!),
            eq(portfolioItems.creatorId, creator.profile.id)
          )
        );
    }
  });

  revalidatePath("/creator/portfolio");
  return { success: true };
}
