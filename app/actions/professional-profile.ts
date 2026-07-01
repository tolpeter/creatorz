"use server";

import { z } from "zod";
import { and, eq, ne, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { creatorProfiles, portfolioItems } from "@/lib/db/schema";
import { getCurrentCreator } from "@/lib/auth";
import { generateUsername } from "@/lib/utils/slug";
import { parseEmbedLink } from "@/lib/utils/embed";
import { PROFESSIONAL_ROLES } from "@/lib/constants";

const ROLE_VALUES = PROFESSIONAL_ROLES.map((r) => r.value) as [string, ...string[]];

const onboardingSchema = z.object({
  displayName: z.string().min(2, "Adj meg egy megjelenített nevet").max(100),
  username: z.string().min(3, "A felhasználónév min. 3 karakter").max(50),
  avatarUrl: z
    .string()
    .url("Tölts fel profilképet")
    // SOHA nem fogadunk el Google-ból átvett képet — valódi feltöltés kell.
    .refine(
      (u) => !/googleusercontent\.com/i.test(u),
      "Tölts fel egy valódi profilképet (a Google-kép nem elég).",
    ),
  bio: z.string().max(500, "A bemutatkozás max. 500 karakter").optional().default(""),
  city: z.string().max(100).optional().default(""),
  county: z.string().max(50).optional().default(""),
  professionalRoles: z
    .array(z.enum(ROLE_VALUES))
    .min(1, "Válassz legalább egy szerepkört"),
  specialties: z.array(z.string().min(1).max(40)).max(15).optional().default([]),
  portfolio: z
    .array(
      z.object({
        url: z.string().url("Érvénytelen link"),
        title: z.string().max(200).optional().default(""),
      }),
    )
    .min(1, "Adj meg legalább 1 portfólió linket")
    .max(15, "Legfeljebb 15 portfólió elem adható meg"),
  websiteUrl: z.string().url("Érvénytelen weboldal link").optional().or(z.literal("")),
  instagramUrl: z.string().url("Érvénytelen Instagram link").optional().or(z.literal("")),
});

export type ProfessionalOnboardingInput = z.input<typeof onboardingSchema>;

/** Kreatív szakember onboarding mentése: profil + külső link portfólió. */
export async function completeProfessionalOnboarding(input: ProfessionalOnboardingInput) {
  const creator = await getCurrentCreator();
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
      and(eq(creatorProfiles.username, username), ne(creatorProfiles.id, creator.profile.id)),
    )
    .limit(1);
  if (clash.length > 0) return { error: "Ez a felhasználónév már foglalt" };

  await db
    .update(creatorProfiles)
    .set({
      username,
      displayName: d.displayName,
      avatarUrl: d.avatarUrl,
      bio: d.bio || null,
      city: d.city || null,
      county: d.county || null,
      profileKind: "professional",
      professionalRoles: d.professionalRoles,
      specialties: d.specialties,
      websiteUrl: d.websiteUrl || null,
      instagramUrl: d.instagramUrl || null,
      onboardingCompleted: true,
      updatedAt: new Date(),
    })
    .where(eq(creatorProfiles.id, creator.profile.id));

  // Külső link portfólió: a korábbi link-elemeket lecseréljük az újakra
  await db
    .delete(portfolioItems)
    .where(
      and(
        eq(portfolioItems.creatorId, creator.profile.id),
        isNotNull(portfolioItems.externalUrl),
      ),
    );

  for (let i = 0; i < d.portfolio.length; i++) {
    const item = d.portfolio[i];
    const parsedEmbed = parseEmbedLink(item.url);
    await db.insert(portfolioItems).values({
      creatorId: creator.profile.id,
      type: "video",
      url: item.url, // a notNull miatt a külső URL kerül ide is
      externalUrl: item.url,
      embedType: parsedEmbed.type,
      title: item.title || null,
      sortOrder: i,
    });
  }

  revalidatePath(`/creators/${username}`);
  revalidatePath("/creators");
  return { success: true };
}
