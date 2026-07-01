"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { creatorProfiles, tiktokConnections } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revokeToken } from "@/lib/tiktok/oauth";
import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/auth";
import { generateUsername } from "@/lib/utils/username";
import { scrapeInstagramFollowers } from "@/lib/scrapers/instagram";
import { scrapeTikTokStats } from "@/lib/scrapers/tiktok";
import { scrapeFacebookFollowers } from "@/lib/scrapers/facebook";
import { fetchYouTubeSubscribers } from "@/lib/scrapers/youtube";
import { refreshCreatorEmbedding } from "@/lib/ai/match";
import { normalizeSocialUrl } from "@/lib/utils/social";
import { MAX_CREATOR_CATEGORIES } from "@/lib/constants";

async function requireCreator() {
  const creator = await getCurrentCreator();
  if (!creator) return null;
  return creator;
}

// ---------- Alapadatok ----------
const basicsSchema = z.object({
  username: z.string().min(3).max(50),
  displayName: z.string().min(2).max(100),
  bio: z.string().max(500).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  county: z.string().max(50).optional().or(z.literal("")),
  // Pontos születési dátum (YYYY-MM-DD). Ebből számoljuk az életkort.
  // Kötelező, és a megadott dátum alapján 13–100 év közötti kell legyen.
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Add meg a születési dátumod")
    .refine((s) => {
      const age = ageFromBirthDate(s);
      return age >= 13 && age <= 100;
    }, "Az életkornak 13 és 100 év között kell lennie"),
  // Nem: kötelező.
  gender: z.string().min(1, "Válaszd ki a nemed").max(20),
  categories: z.array(z.string()).max(MAX_CREATOR_CATEGORIES, `Legfeljebb ${MAX_CREATOR_CATEGORIES} kategóriát választhatsz`),
  languages: z.array(z.string()).min(1),
});

/** Életkor (teljes év) számítása ISO születési dátumból.
 *  NEM exportált — `"use server"` fájlban csak async export lehet. */
function ageFromBirthDate(iso: string): number {
  const b = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

export async function updateCreatorBasics(input: z.input<typeof basicsSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = basicsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const data = parsed.data;

  // Username normalizálás + egyediség (önmagát kizárva)
  const username = generateUsername(data.username);
  if (username.length < 3) {
    return { error: "A felhasználónév túl rövid (min. 3 karakter, ékezet nélkül)" };
  }
  const clash = await db
    .select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(
      and(eq(creatorProfiles.username, username), ne(creatorProfiles.id, creator.profile.id))
    )
    .limit(1);
  if (clash.length > 0) {
    return { error: "Ez a felhasználónév már foglalt" };
  }

  await db
    .update(creatorProfiles)
    .set({
      username,
      displayName: data.displayName,
      bio: data.bio || null,
      city: data.city || null,
      county: data.county || null,
      birthDate: data.birthDate,
      age: ageFromBirthDate(data.birthDate),
      gender: data.gender,
      categories: data.categories,
      languages: data.languages,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  // AI matching: a bio/kategória változott → embedding frissítése (best-effort).
  await refreshCreatorEmbedding(creator.profile.id);

  revalidatePath("/creator/profile");
  return { success: true, username };
}

// ---------- Megjelenés (avatar/banner) ----------
const appearanceSchema = z.object({
  avatarUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
});

export async function updateCreatorAppearance(input: z.input<typeof appearanceSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = appearanceSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };

  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.avatarUrl !== undefined) set.avatarUrl = parsed.data.avatarUrl || null;
  if (parsed.data.bannerUrl !== undefined) set.bannerUrl = parsed.data.bannerUrl || null;

  await db.update(creatorProfiles).set(set).where(eq(creatorProfiles.id, creator.profile.id));
  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Eszközök ----------
const equipmentSchema = z.object({
  phone: z.string().max(120).optional().or(z.literal("")),
  camera: z.string().max(120).optional().or(z.literal("")),
  microphone: z.string().max(120).optional().or(z.literal("")),
  editing: z.string().max(120).optional().or(z.literal("")),
});

export async function updateCreatorEquipment(input: z.input<typeof equipmentSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = equipmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };

  await db
    .update(creatorProfiles)
    .set({
      equipment: {
        phone: parsed.data.phone || undefined,
        camera: parsed.data.camera || undefined,
        microphone: parsed.data.microphone || undefined,
        editing: parsed.data.editing || undefined,
      },
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Modell-adatlap ----------
const modelSchema = z.object({
  heightCm: z.coerce.number().int().min(50).max(250).optional().nullable(),
  weightKg: z.coerce.number().int().min(20).max(300).optional().nullable(),
  hairColor: z.string().max(20).optional().or(z.literal("")),
  eyeColor: z.string().max(20).optional().or(z.literal("")),
  bodyArt: z.string().max(300).optional().or(z.literal("")),
  modelTypes: z.array(z.string().max(30)).max(8).optional().default([]),
});

export async function updateModelAttributes(input: z.input<typeof modelSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = modelSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };
  const d = parsed.data;

  await db
    .update(creatorProfiles)
    .set({
      modelAttributes: {
        heightCm: d.heightCm ?? undefined,
        weightKg: d.weightKg ?? undefined,
        hairColor: d.hairColor || undefined,
        eyeColor: d.eyeColor || undefined,
        bodyArt: d.bodyArt || undefined,
        modelTypes: d.modelTypes ?? [],
      },
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Social fiókok ----------
/**
 * Best-effort: a TikTok bővített statisztikák (összes like, videószám, átlag
 * megtekintés) kitöltése a megadott profil-URL alapján, ha a felhasználó nem
 * adta meg őket kézzel. A követőszámot NEM írja felül (azt a user adja meg).
 * Hibatűrő: ha a scrape nem sikerül, csendben kihagyja.
 */
async function backfillTikTokExtras(creatorId: string, tiktokUrl: string | null) {
  if (!tiktokUrl) return;
  try {
    const stats = await scrapeTikTokStats(tiktokUrl);
    const extra: Record<string, unknown> = {};
    if (stats.likes != null) extra.tiktokLikes = stats.likes;
    if (stats.avgViews != null) extra.tiktokAvgViews = stats.avgViews;
    if (stats.videoCount != null) extra.tiktokVideoCount = stats.videoCount;
    if (Object.keys(extra).length === 0) return;
    extra.updatedAt = new Date();
    await db.update(creatorProfiles).set(extra).where(eq(creatorProfiles.id, creatorId));
  } catch {
    /* best-effort — a 4 naponta futó cron úgyis pótolja */
  }
}

/**
 * Hivatalos TikTok-összekötés bontása: token visszavonása a TikToknál, a
 * tárolt tokenek törlése, és a `tiktokOfficial` flag kikapcsolása. (A statok
 * megmaradnak utolsó ismert értéken, de már nem „hivatalos" jelöléssel.)
 */
export async function disconnectTikTok() {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const [conn] = await db
    .select()
    .from(tiktokConnections)
    .where(eq(tiktokConnections.userId, creator.appUserId))
    .limit(1);
  if (conn) {
    await revokeToken(conn.accessToken);
    await db.delete(tiktokConnections).where(eq(tiktokConnections.userId, creator.appUserId));
  }

  await db
    .update(creatorProfiles)
    .set({ tiktokOfficial: false, updatedAt: new Date() })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

const socialSchema = z.object({
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.coerce.number().int().min(0).optional().nullable(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.coerce.number().int().min(0).optional().nullable(),
  tiktokLikes: z.coerce.number().int().min(0).optional().nullable(),
  tiktokAvgViews: z.coerce.number().int().min(0).optional().nullable(),
  facebookUrl: z.string().max(300).optional().or(z.literal("")),
  facebookFollowers: z.coerce.number().int().min(0).optional().nullable(),
  youtubeUrl: z.string().max(300).optional().or(z.literal("")),
  youtubeSubscribers: z.coerce.number().int().min(0).optional().nullable(),
});

export async function updateCreatorSocial(input: z.input<typeof socialSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = socialSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adatok" };
  const d = {
    ...parsed.data,
    instagramUrl: normalizeSocialUrl("instagram", parsed.data.instagramUrl),
    tiktokUrl: normalizeSocialUrl("tiktok", parsed.data.tiktokUrl),
    facebookUrl: normalizeSocialUrl("facebook", parsed.data.facebookUrl),
    youtubeUrl: normalizeSocialUrl("youtube", parsed.data.youtubeUrl),
  };

  const missingCount = [
    { label: "Instagram", url: d.instagramUrl, count: d.instagramFollowers },
    { label: "TikTok", url: d.tiktokUrl, count: d.tiktokFollowers },
    { label: "Facebook", url: d.facebookUrl, count: d.facebookFollowers },
    { label: "YouTube", url: d.youtubeUrl, count: d.youtubeSubscribers },
  ].find((item) => item.url && !(item.count && item.count > 0));
  if (missingCount) {
    return {
      error: `Add meg a(z) ${missingCount.label} követő/feliratkozó számát is.`,
    };
  }

  await db
    .update(creatorProfiles)
    .set({
      instagramUrl: d.instagramUrl || null,
      instagramFollowers: d.instagramFollowers ?? null,
      // TikTok URL + követő kézzel is menthető (a scrape/AI fallbackhez). A
      // hivatalos like/videó/official mezőket NEM bántjuk (azt az OAuth kezeli).
      tiktokUrl: d.tiktokUrl || null,
      tiktokFollowers: d.tiktokFollowers ?? null,
      facebookUrl: d.facebookUrl || null,
      facebookFollowers: d.facebookFollowers ?? null,
      youtubeUrl: d.youtubeUrl || null,
      youtubeSubscribers: d.youtubeSubscribers ?? null,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  // Ha van TikTok link, de a like-ot nem ismerjük, best-effort behúzzuk a
  // bővített statokat (csak ha nem hivatalosan kötött — azt nem írjuk felül).
  if (d.tiktokUrl && d.tiktokFollowers && d.tiktokLikes == null) {
    await backfillTikTokExtras(creator.profile.id, d.tiktokUrl);
  }

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Bemutatkozó videó (1 db, kiemelt) ----------
const introVideoSchema = z.object({
  introVideoUrl: z.string().max(600).optional().nullable(),
});

export async function updateCreatorIntroVideo(
  input: z.input<typeof introVideoSchema>
) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };
  const parsed = introVideoSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen videó URL" };

  await db
    .update(creatorProfiles)
    .set({
      introVideoUrl: parsed.data.introVideoUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Self-hitelesítés ----------
/**
 * A creator maga hitelesíti a profilját. Feltételek (hogy valódi, kész profil
 * kapjon badge-et): profilkép, bemutatkozás, legalább 1 kategória és legalább
 * 1 összekapcsolt közösségi fiók. Siker esetén a `verified` flag igazra vált.
 */
export async function verifyCreatorProfile() {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  // Friss adatok
  const rows = await db
    .select()
    .from(creatorProfiles)
    .where(eq(creatorProfiles.id, creator.profile.id))
    .limit(1);
  const p = rows[0];
  if (!p) return { error: "Profil nem található" };

  const missing: string[] = [];
  if (!p.avatarUrl) missing.push("profilkép");
  if (!p.bio || p.bio.trim().length < 10) missing.push("bemutatkozás (min. 10 karakter)");
  if (!p.categories || p.categories.length < 1) missing.push("legalább 1 kategória");
  const hasSocial = Boolean(
    p.instagramUrl || p.tiktokUrl || p.facebookUrl || p.youtubeUrl,
  );
  if (!hasSocial) missing.push("legalább 1 közösségi fiók");

  if (missing.length > 0) {
    return {
      error: `A hitelesítéshez még hiányzik: ${missing.join(", ")}.`,
      missing,
    };
  }

  await db
    .update(creatorProfiles)
    .set({ verified: true, verifiedAt: new Date(), updatedAt: new Date() })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  revalidatePath("/creator");
  return { success: true };
}

// ---------- AI összekapcsolás (csak URL → követőszámok) ----------
const connectSchema = z.object({
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  facebookUrl: z.string().max(300).optional().or(z.literal("")),
  youtubeUrl: z.string().max(300).optional().or(z.literal("")),
});

export type ConnectSocialsResult = {
  success?: boolean;
  error?: string;
  instagramFollowers?: number | null;
  tiktokFollowers?: number | null;
  facebookFollowers?: number | null;
  youtubeSubscribers?: number | null;
  failed?: string[];
};

/**
 * "Összekapcsol" gomb: a creator csak az URL-eket adja meg, az AI/scrape
 * pipeline behúzza a követő/feliratkozó számokat, elmenti és visszaadja.
 * Innentől a napi/4 napos cron tartja frissen.
 */
export async function connectCreatorSocials(
  input: z.input<typeof connectSchema>
): Promise<ConnectSocialsResult> {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = connectSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen URL-ek" };
  // Felhasználónév → teljes URL (pl. "ptrlgys" → https://www.tiktok.com/@ptrlgys)
  const d = {
    instagramUrl: normalizeSocialUrl("instagram", parsed.data.instagramUrl),
    tiktokUrl: normalizeSocialUrl("tiktok", parsed.data.tiktokUrl),
    facebookUrl: normalizeSocialUrl("facebook", parsed.data.facebookUrl),
    youtubeUrl: normalizeSocialUrl("youtube", parsed.data.youtubeUrl),
  };

  if (!d.instagramUrl && !d.tiktokUrl && !d.facebookUrl && !d.youtubeUrl) {
    return { error: "Adj meg legalább egy social profil linket" };
  }

  const now = new Date();
  const set: Record<string, unknown> = { updatedAt: now };

  const out: ConnectSocialsResult = {
    instagramFollowers: null,
    tiktokFollowers: null,
    facebookFollowers: null,
    youtubeSubscribers: null,
    failed: [],
  };

  // Platformonként hibatűrő: egy hiba nem állítja le a többit.
  if (d.instagramUrl) {
    try {
      const n = await scrapeInstagramFollowers(d.instagramUrl);
      if (n != null && n > 0) {
        set.instagramUrl = d.instagramUrl;
        set.instagramFollowers = n;
        set.instagramVerified = true;
        set.instagramLastChecked = now;
        out.instagramFollowers = n;
      } else out.failed!.push("Instagram");
    } catch {
      out.failed!.push("Instagram");
    }
  }
  if (d.tiktokUrl) {
    try {
      const stats = await scrapeTikTokStats(d.tiktokUrl);
      if (stats.followers != null && stats.followers > 0) {
        set.tiktokUrl = d.tiktokUrl;
        set.tiktokFollowers = stats.followers;
        // Bővített statisztika — csak ha sikerült kinyerni.
        if (stats.likes != null) set.tiktokLikes = stats.likes;
        if (stats.avgViews != null) set.tiktokAvgViews = stats.avgViews;
        if (stats.videoCount != null) set.tiktokVideoCount = stats.videoCount;
        set.tiktokVerified = true;
        set.tiktokLastChecked = now;
        out.tiktokFollowers = stats.followers;
      } else out.failed!.push("TikTok");
    } catch {
      out.failed!.push("TikTok");
    }
  }
  if (d.facebookUrl) {
    try {
      const n = await scrapeFacebookFollowers(d.facebookUrl);
      if (n != null && n > 0) {
        set.facebookUrl = d.facebookUrl;
        set.facebookFollowers = n;
        set.facebookVerified = true;
        set.facebookLastChecked = now;
        out.facebookFollowers = n;
      } else out.failed!.push("Facebook");
    } catch {
      out.failed!.push("Facebook");
    }
  }
  if (d.youtubeUrl) {
    try {
      const n = await fetchYouTubeSubscribers(d.youtubeUrl);
      if (n != null && n > 0) {
        set.youtubeUrl = d.youtubeUrl;
        set.youtubeSubscribers = n;
        set.youtubeVerified = true;
        set.youtubeLastChecked = now;
        out.youtubeSubscribers = n;
      } else out.failed!.push("YouTube");
    } catch {
      out.failed!.push("YouTube");
    }
  }

  const hasSuccessfulFetch =
    typeof set.instagramFollowers === "number" ||
    typeof set.tiktokFollowers === "number" ||
    typeof set.facebookFollowers === "number" ||
    typeof set.youtubeSubscribers === "number";

  if (!hasSuccessfulFetch) {
    return {
      error:
        "Nem sikerült lekérni a követő/feliratkozó számot. Adj meg másik linket, vagy írd be kézzel a profilszerkesztőben.",
      ...out,
    };
  }

  await db
    .update(creatorProfiles)
    .set(set)
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true, ...out };
}

// ---------- Onboarding (összevont) ----------
// Az árazás kikerült — az ár mindig megegyezés kérdése a felek között.
// A követőszámokat nem kézzel adják meg: az „Összekapcsol” / cron tölti.
const onboardingSchema = basicsSchema.extend({
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.coerce.number().int().min(0).optional().nullable(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.coerce.number().int().min(0).optional().nullable(),
  facebookUrl: z.string().max(300).optional().or(z.literal("")),
  facebookFollowers: z.coerce.number().int().min(0).optional().nullable(),
  youtubeUrl: z.string().max(300).optional().or(z.literal("")),
  youtubeSubscribers: z.coerce.number().int().min(0).optional().nullable(),
  avatarUrl: z.string().max(600).optional().or(z.literal("")),
  modelAttributes: z
    .object({
      heightCm: z.coerce.number().int().min(50).max(250).optional().nullable(),
      weightKg: z.coerce.number().int().min(20).max(300).optional().nullable(),
      hairColor: z.string().max(20).optional().or(z.literal("")),
      eyeColor: z.string().max(20).optional().or(z.literal("")),
      bodyArt: z.string().max(300).optional().or(z.literal("")),
      modelTypes: z.array(z.string().max(30)).max(8).optional().default([]),
    })
    .optional(),
});

export async function completeCreatorOnboarding(input: z.input<typeof onboardingSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  // Profilkép kötelező, és SOHA nem fogadunk el Google-ból átvett képet —
  // valódi feltöltés kell a saját tárhelyünkre (a Google-URL placeholder/lejáró).
  const effectiveAvatar = parsed.data.avatarUrl || creator.profile.avatarUrl || "";
  if (!effectiveAvatar || /googleusercontent\.com/i.test(effectiveAvatar)) {
    return { error: "Tölts fel egy valódi profilképet (kötelező)." };
  }
  const d = {
    ...parsed.data,
    instagramUrl: normalizeSocialUrl("instagram", parsed.data.instagramUrl),
    tiktokUrl: normalizeSocialUrl("tiktok", parsed.data.tiktokUrl),
    facebookUrl: normalizeSocialUrl("facebook", parsed.data.facebookUrl),
    youtubeUrl: normalizeSocialUrl("youtube", parsed.data.youtubeUrl),
  };

  const username = generateUsername(d.username);
  if (username.length < 3) {
    return { error: "A felhasználónév túl rövid (min. 3 karakter, ékezet nélkül)" };
  }
  const clash = await db
    .select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(
      and(eq(creatorProfiles.username, username), ne(creatorProfiles.id, creator.profile.id))
    )
    .limit(1);
  if (clash.length > 0) {
    return { error: "Ez a felhasználónév már foglalt" };
  }

  // Legalább 1 közösségi platform kötelező (a 4 közül).
  const hasSocial = Boolean(
    d.instagramUrl || d.tiktokUrl || d.facebookUrl || d.youtubeUrl,
  );
  if (!hasSocial) {
    return {
      error: "Adj meg legalább egy közösségi profilt (a 4 közül).",
    };
  }

  const missingCount = [
    { label: "Instagram", url: d.instagramUrl, count: d.instagramFollowers },
    { label: "TikTok", url: d.tiktokUrl, count: d.tiktokFollowers },
    { label: "Facebook", url: d.facebookUrl, count: d.facebookFollowers },
    { label: "YouTube", url: d.youtubeUrl, count: d.youtubeSubscribers },
  ].find((item) => item.url && !(item.count && item.count > 0));
  if (missingCount) {
    return {
      error: `Add meg a(z) ${missingCount.label} követő/feliratkozó számát is, vagy töröld a linket.`,
    };
  }

  await db
    .update(creatorProfiles)
    .set({
      username,
      displayName: d.displayName,
      bio: d.bio || null,
      city: d.city || null,
      county: d.county || null,
      birthDate: d.birthDate,
      age: ageFromBirthDate(d.birthDate),
      gender: d.gender,
      // Avatar: csak akkor írjuk felül, ha most adtak meg újat.
      ...(d.avatarUrl ? { avatarUrl: d.avatarUrl } : {}),
      categories: d.categories,
      languages: d.languages,
      instagramUrl: d.instagramUrl || null,
      instagramFollowers: d.instagramUrl ? d.instagramFollowers ?? null : null,
      tiktokUrl: d.tiktokUrl || null,
      tiktokFollowers: d.tiktokUrl ? d.tiktokFollowers ?? null : null,
      facebookUrl: d.facebookUrl || null,
      facebookFollowers: d.facebookUrl ? d.facebookFollowers ?? null : null,
      youtubeUrl: d.youtubeUrl || null,
      youtubeSubscribers: d.youtubeUrl ? d.youtubeSubscribers ?? null : null,
      ...(d.modelAttributes
        ? {
            modelAttributes: {
              heightCm: d.modelAttributes.heightCm ?? undefined,
              weightKg: d.modelAttributes.weightKg ?? undefined,
              hairColor: d.modelAttributes.hairColor || undefined,
              eyeColor: d.modelAttributes.eyeColor || undefined,
              bodyArt: d.modelAttributes.bodyArt || undefined,
              modelTypes: d.modelAttributes.modelTypes ?? [],
            },
          }
        : {}),
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  // TikTok bővített statok (like / videószám) automatikus behúzása, hogy ne
  // csak a kézzel megadott követőszám látszódjon a profilon.
  if (d.tiktokUrl) {
    await backfillTikTokExtras(creator.profile.id, d.tiktokUrl);
  }

  // AI matching: a profil embeddingjének frissítése (best-effort).
  await refreshCreatorEmbedding(creator.profile.id);

  revalidatePath("/creator");
  revalidatePath("/creator/profile");
  return { success: true };
}

/** Username elérhetőség ellenőrzés (élő, onboarding/profil) */
export async function checkUsernameAvailable(raw: string) {
  const creator = await requireCreator();
  if (!creator) return { available: false, normalized: "" };
  const username = generateUsername(raw);
  if (username.length < 3) return { available: false, normalized: username };
  const clash = await db
    .select({ id: creatorProfiles.id })
    .from(creatorProfiles)
    .where(
      and(eq(creatorProfiles.username, username), ne(creatorProfiles.id, creator.profile.id))
    )
    .limit(1);
  return { available: clash.length === 0, normalized: username };
}
