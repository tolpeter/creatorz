import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function ageFromBirthDate(birth: string | null): number | null {
  if (!birth) return null;
  const d = new Date(birth);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

/** A bejelentkezett user TELJES szerkeszthető profilja (creator vagy brand). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (user.role === "creator") {
    const [p] = await db
      .select()
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    return Response.json({
      role: "creator",
      profile: p
        ? {
            displayName: p.displayName,
            username: p.username,
            avatarUrl: p.avatarUrl,
            bio: p.bio,
            city: p.city,
            county: p.county,
            birthDate: p.birthDate,
            gender: p.gender,
            categories: p.categories ?? [],
            languages: p.languages ?? [],
            websiteUrl: p.websiteUrl,
            instagramUrl: p.instagramUrl,
            instagramFollowers: p.instagramFollowers,
            tiktokUrl: p.tiktokUrl,
            tiktokFollowers: p.tiktokFollowers,
            facebookUrl: p.facebookUrl,
            facebookFollowers: p.facebookFollowers,
            youtubeUrl: p.youtubeUrl,
            youtubeSubscribers: p.youtubeSubscribers,
            equipment: p.equipment ?? {},
          }
        : null,
    });
  }
  if (user.role === "brand") {
    const [p] = await db
      .select()
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, user.id))
      .limit(1);
    return Response.json({
      role: "brand",
      profile: p
        ? {
            companyName: p.companyName,
            logoUrl: p.logoUrl,
            contactName: p.contactName,
            contactPhone: p.contactPhone,
            taxNumber: p.taxNumber,
            address: p.address,
            industry: p.industry,
            websiteUrl: p.websiteUrl,
            description: p.description,
          }
        : null,
    });
  }
  return Response.json({ role: user.role, profile: null });
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};
const num = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
};

const creatorSchema = z.object({
  displayName: z.string().min(1).max(100),
  avatarUrl: z.string().max(600).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(50).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  gender: z.string().max(20).optional().nullable(),
  categories: z.array(z.string()).max(8).optional(),
  languages: z.array(z.string()).max(20).optional(),
  websiteUrl: z.string().max(300).optional().nullable(),
  instagramUrl: z.string().max(300).optional().nullable(),
  instagramFollowers: z.any().optional(),
  tiktokUrl: z.string().max(300).optional().nullable(),
  tiktokFollowers: z.any().optional(),
  facebookUrl: z.string().max(300).optional().nullable(),
  facebookFollowers: z.any().optional(),
  youtubeUrl: z.string().max(300).optional().nullable(),
  youtubeSubscribers: z.any().optional(),
  equipment: z
    .object({
      phone: z.string().max(120).optional().nullable(),
      camera: z.string().max(120).optional().nullable(),
      microphone: z.string().max(120).optional().nullable(),
      editing: z.string().max(120).optional().nullable(),
    })
    .optional(),
});

const brandSchema = z.object({
  companyName: z.string().min(1).max(200),
  logoUrl: z.string().max(600).optional().nullable(),
  contactName: z.string().max(100).optional().nullable(),
  contactPhone: z.string().max(30).optional().nullable(),
  taxNumber: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  websiteUrl: z.string().max(300).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

export async function POST(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ error: "bad request" }, { status: 400 });
  }

  if (user.role === "creator") {
    const parsed = creatorSchema.safeParse(json);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" }, { status: 400 });
    const d = parsed.data;
    const birthDate = clean(d.birthDate);
    await db
      .update(creatorProfiles)
      .set({
        displayName: d.displayName.trim(),
        avatarUrl: clean(d.avatarUrl),
        bio: clean(d.bio),
        city: clean(d.city),
        county: clean(d.county),
        birthDate: birthDate,
        age: ageFromBirthDate(birthDate),
        gender: clean(d.gender),
        ...(d.categories ? { categories: d.categories } : {}),
        ...(d.languages ? { languages: d.languages } : {}),
        websiteUrl: clean(d.websiteUrl),
        instagramUrl: clean(d.instagramUrl),
        instagramFollowers: num(d.instagramFollowers),
        tiktokUrl: clean(d.tiktokUrl),
        tiktokFollowers: num(d.tiktokFollowers),
        facebookUrl: clean(d.facebookUrl),
        facebookFollowers: num(d.facebookFollowers),
        youtubeUrl: clean(d.youtubeUrl),
        youtubeSubscribers: num(d.youtubeSubscribers),
        ...(d.equipment
          ? {
              equipment: {
                phone: clean(d.equipment.phone) ?? undefined,
                camera: clean(d.equipment.camera) ?? undefined,
                microphone: clean(d.equipment.microphone) ?? undefined,
                editing: clean(d.equipment.editing) ?? undefined,
              },
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(creatorProfiles.userId, user.id));
    return Response.json({ success: true });
  }
  if (user.role === "brand") {
    const parsed = brandSchema.safeParse(json);
    if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Érvénytelen adatok" }, { status: 400 });
    const d = parsed.data;
    await db
      .update(brandProfiles)
      .set({
        companyName: d.companyName.trim(),
        logoUrl: clean(d.logoUrl),
        contactName: clean(d.contactName),
        contactPhone: clean(d.contactPhone),
        taxNumber: clean(d.taxNumber),
        address: clean(d.address),
        industry: clean(d.industry),
        websiteUrl: clean(d.websiteUrl),
        description: clean(d.description),
        updatedAt: new Date(),
      })
      .where(eq(brandProfiles.userId, user.id));
    return Response.json({ success: true });
  }
  return Response.json({ error: "nem szerkeszthető" }, { status: 400 });
}
