"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { brandProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getCurrentBrand } from "@/lib/auth";

const onboardingSchema = z.object({
  companyName: z.string().min(2, "Add meg a cég / vállalkozás nevét").max(200),
  websiteUrl: z.string().max(300).optional().or(z.literal("")),
  contactName: z.string().min(2, "Add meg a kapcsolattartó nevét").max(100),
  industry: z.string().min(1, "Válassz iparágat").max(100),
  // Székhely opcionális (nem kötelező regisztrációkor).
  address: z.string().max(300).optional().or(z.literal("")),
});

export async function completeBrandOnboarding(input: z.input<typeof onboardingSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };

  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  await db
    .update(brandProfiles)
    .set({
      companyName: d.companyName,
      websiteUrl: d.websiteUrl || null,
      contactName: d.contactName,
      industry: d.industry,
      ...(d.address ? { address: d.address } : {}),
      updatedAt: new Date(),
    })
    .where(eq(brandProfiles.id, brand.profile.id));

  revalidatePath("/brand");
  return { success: true };
}

const profileSchema = onboardingSchema.extend({
  logoUrl: z.string().optional().nullable(),
  contactPhone: z.string().max(30).optional().or(z.literal("")),
  taxNumber: z.string().max(30).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export async function updateBrandProfile(input: z.input<typeof profileSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" };
  }
  const d = parsed.data;

  await db
    .update(brandProfiles)
    .set({
      companyName: d.companyName,
      websiteUrl: d.websiteUrl || null,
      logoUrl: d.logoUrl || null,
      contactName: d.contactName || null,
      contactPhone: d.contactPhone || null,
      industry: d.industry || null,
      taxNumber: d.taxNumber || null,
      address: d.address || null,
      description: d.description || null,
      updatedAt: new Date(),
    })
    .where(eq(brandProfiles.id, brand.profile.id));

  revalidatePath("/brand/profile");
  return { success: true };
}

const logoSchema = z.object({ logoUrl: z.string().max(600).optional().nullable() });

/** Csak a logó frissítése (a vezérlőpulti gyors-feltöltőhöz). */
export async function updateBrandLogo(input: z.input<typeof logoSchema>) {
  const brand = await getCurrentBrand();
  if (!brand) return { error: "Nincs bejelentkezve" };
  const parsed = logoSchema.safeParse(input);
  if (!parsed.success) return { error: "Érvénytelen adat" };

  await db
    .update(brandProfiles)
    .set({ logoUrl: parsed.data.logoUrl || null, updatedAt: new Date() })
    .where(eq(brandProfiles.id, brand.profile.id));

  revalidatePath("/brand");
  revalidatePath("/brand/profile");
  return { success: true };
}
