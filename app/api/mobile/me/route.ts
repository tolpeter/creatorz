import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles } from "@/lib/db/schema";
import { getMobileUser } from "@/lib/mobile-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** A bejelentkezett user szerkeszthető profilja (creator vagy brand). */
export async function GET(req: Request) {
  const user = await getMobileUser(req);
  if (!user) return Response.json({ error: "unauthorized" }, { status: 401 });

  if (user.role === "creator") {
    const [p] = await db
      .select({
        displayName: creatorProfiles.displayName,
        username: creatorProfiles.username,
        avatarUrl: creatorProfiles.avatarUrl,
        bio: creatorProfiles.bio,
        city: creatorProfiles.city,
        county: creatorProfiles.county,
        instagramUrl: creatorProfiles.instagramUrl,
        tiktokUrl: creatorProfiles.tiktokUrl,
        youtubeUrl: creatorProfiles.youtubeUrl,
        facebookUrl: creatorProfiles.facebookUrl,
      })
      .from(creatorProfiles)
      .where(eq(creatorProfiles.userId, user.id))
      .limit(1);
    return Response.json({ role: "creator", profile: p ?? null });
  }
  if (user.role === "brand") {
    const [p] = await db
      .select({
        companyName: brandProfiles.companyName,
        logoUrl: brandProfiles.logoUrl,
        contactName: brandProfiles.contactName,
        websiteUrl: brandProfiles.websiteUrl,
        industry: brandProfiles.industry,
        description: brandProfiles.description,
      })
      .from(brandProfiles)
      .where(eq(brandProfiles.userId, user.id))
      .limit(1);
    return Response.json({ role: "brand", profile: p ?? null });
  }
  return Response.json({ role: user.role, profile: null });
}

const creatorSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(50).optional().nullable(),
  instagramUrl: z.string().max(300).optional().nullable(),
  tiktokUrl: z.string().max(300).optional().nullable(),
  youtubeUrl: z.string().max(300).optional().nullable(),
  facebookUrl: z.string().max(300).optional().nullable(),
});
const brandSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(100).optional().nullable(),
  websiteUrl: z.string().max(300).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
});

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t === "" ? null : t;
};

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
    await db
      .update(creatorProfiles)
      .set({
        displayName: d.displayName.trim(),
        bio: clean(d.bio),
        city: clean(d.city),
        county: clean(d.county),
        instagramUrl: clean(d.instagramUrl),
        tiktokUrl: clean(d.tiktokUrl),
        youtubeUrl: clean(d.youtubeUrl),
        facebookUrl: clean(d.facebookUrl),
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
        contactName: clean(d.contactName),
        websiteUrl: clean(d.websiteUrl),
        industry: clean(d.industry),
        description: clean(d.description),
        updatedAt: new Date(),
      })
      .where(eq(brandProfiles.userId, user.id));
    return Response.json({ success: true });
  }
  return Response.json({ error: "nem szerkeszthető" }, { status: 400 });
}
