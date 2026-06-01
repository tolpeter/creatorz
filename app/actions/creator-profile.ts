"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { creatorProfiles } from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentCreator } from "@/lib/auth";
import { generateUsername } from "@/lib/utils/username";

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
  age: z.coerce.number().int().min(13).max(100).optional().nullable(),
  gender: z.string().max(20).optional().or(z.literal("")),
  categories: z.array(z.string()).max(3),
  languages: z.array(z.string()).min(1),
});

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
      age: data.age ?? null,
      gender: data.gender || null,
      categories: data.categories,
      languages: data.languages,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

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

// ---------- Social fiókok ----------
const socialSchema = z.object({
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.coerce.number().int().min(0).optional().nullable(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.coerce.number().int().min(0).optional().nullable(),
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
  const d = parsed.data;

  await db
    .update(creatorProfiles)
    .set({
      instagramUrl: d.instagramUrl || null,
      instagramFollowers: d.instagramFollowers ?? null,
      tiktokUrl: d.tiktokUrl || null,
      tiktokFollowers: d.tiktokFollowers ?? null,
      facebookUrl: d.facebookUrl || null,
      facebookFollowers: d.facebookFollowers ?? null,
      youtubeUrl: d.youtubeUrl || null,
      youtubeSubscribers: d.youtubeSubscribers ?? null,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Rate card ----------
const rateCardSchema = z.object({
  rateCard: z
    .array(
      z.object({
        service: z.string().min(1).max(120),
        priceHuf: z.coerce.number().int().min(0),
        description: z.string().max(300).optional().or(z.literal("")),
      })
    )
    .max(20),
});

export async function updateCreatorRateCard(input: z.input<typeof rateCardSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = rateCardSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen rate card adatok" };

  await db
    .update(creatorProfiles)
    .set({
      rateCard: parsed.data.rateCard.map((r) => ({
        service: r.service,
        priceHuf: r.priceHuf,
        description: r.description || undefined,
      })),
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  revalidatePath("/creator/profile");
  return { success: true };
}

// ---------- Onboarding (összevont) ----------
const onboardingSchema = basicsSchema.extend({
  instagramUrl: z.string().max(300).optional().or(z.literal("")),
  instagramFollowers: z.coerce.number().int().min(0).optional().nullable(),
  tiktokUrl: z.string().max(300).optional().or(z.literal("")),
  tiktokFollowers: z.coerce.number().int().min(0).optional().nullable(),
  facebookUrl: z.string().max(300).optional().or(z.literal("")),
  facebookFollowers: z.coerce.number().int().min(0).optional().nullable(),
  youtubeUrl: z.string().max(300).optional().or(z.literal("")),
  youtubeSubscribers: z.coerce.number().int().min(0).optional().nullable(),
  rateCard: rateCardSchema.shape.rateCard.optional(),
});

export async function completeCreatorOnboarding(input: z.input<typeof onboardingSchema>) {
  const creator = await requireCreator();
  if (!creator) return { error: "Nincs bejelentkezve" };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

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

  await db
    .update(creatorProfiles)
    .set({
      username,
      displayName: d.displayName,
      bio: d.bio || null,
      city: d.city || null,
      county: d.county || null,
      age: d.age ?? null,
      gender: d.gender || null,
      categories: d.categories,
      languages: d.languages,
      instagramUrl: d.instagramUrl || null,
      instagramFollowers: d.instagramFollowers ?? null,
      tiktokUrl: d.tiktokUrl || null,
      tiktokFollowers: d.tiktokFollowers ?? null,
      facebookUrl: d.facebookUrl || null,
      facebookFollowers: d.facebookFollowers ?? null,
      youtubeUrl: d.youtubeUrl || null,
      youtubeSubscribers: d.youtubeSubscribers ?? null,
      rateCard: (d.rateCard ?? []).map((r) => ({
        service: r.service,
        priceHuf: r.priceHuf,
        description: r.description || undefined,
      })),
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

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
