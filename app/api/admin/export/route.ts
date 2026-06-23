import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  users,
  creatorProfiles,
  brandProfiles,
  ads,
  reviews,
  newsletterSubscribers,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { GENDER_OPTIONS } from "@/lib/constants";

/** Életkor a születési dátumból (fallback: tárolt age). */
function ageOf(birthDate: unknown, storedAge: number | null): string {
  if (birthDate) {
    const d = new Date(birthDate as string);
    if (!isNaN(d.getTime())) {
      const ref = new Date();
      let a = ref.getFullYear() - d.getFullYear();
      const m = ref.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) a -= 1;
      if (a > 0 && a < 120) return String(a);
    }
  }
  return storedAge && storedAge > 0 ? String(storedAge) : "";
}

function genderLabel(g: string | null): string {
  return GENDER_OPTIONS.find((o) => o.value === g)?.label ?? (g ?? "");
}

function cell(v: unknown): string {
  if (v == null) return "";
  let s: string;
  if (v instanceof Date) s = v.toISOString();
  else if (Array.isArray(v)) s = v.join("; ");
  else s = String(v);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(headers: string[], rows: unknown[][]): string {
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(r.map(cell).join(","));
  // UTF-8 BOM, hogy az Excel helyesen kezelje az ékezeteket
  return "﻿" + lines.join("\r\n");
}

async function build(type: string): Promise<{ headers: string[]; rows: unknown[][] } | null> {
  switch (type) {
    case "users": {
      const r = await db
        .select({
          id: users.id, email: users.email, role: users.role,
          approved: users.approved, suspended: users.suspended, createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));
      return {
        headers: ["id", "email", "szerep", "jovahagyva", "felfuggesztve", "regisztralt"],
        rows: r.map((u) => [u.id, u.email, u.role, u.approved, u.suspended, u.createdAt]),
      };
    }
    case "creators":
    case "creators-ugc":
    case "creators-pro": {
      const kind =
        type === "creators-ugc" ? "ugc" : type === "creators-pro" ? "professional" : null;
      const r = await db
        .select({
          username: creatorProfiles.username, displayName: creatorProfiles.displayName,
          email: users.email,
          birthDate: creatorProfiles.birthDate, age: creatorProfiles.age,
          gender: creatorProfiles.gender,
          city: creatorProfiles.city, county: creatorProfiles.county,
          profileKind: creatorProfiles.profileKind,
          categories: creatorProfiles.categories,
          roles: creatorProfiles.professionalRoles, specialties: creatorProfiles.specialties,
          languages: creatorProfiles.languages,
          website: creatorProfiles.websiteUrl,
          igUrl: creatorProfiles.instagramUrl, ig: creatorProfiles.instagramFollowers,
          ttUrl: creatorProfiles.tiktokUrl, tt: creatorProfiles.tiktokFollowers,
          ytUrl: creatorProfiles.youtubeUrl, yt: creatorProfiles.youtubeSubscribers,
          fbUrl: creatorProfiles.facebookUrl, fb: creatorProfiles.facebookFollowers,
          verified: creatorProfiles.verified,
          featured: creatorProfiles.isFeatured, adminFeatured: creatorProfiles.isAdminFeatured,
          rating: creatorProfiles.averageRating, reviewCount: creatorProfiles.reviewCount,
          createdAt: creatorProfiles.createdAt,
        })
        .from(creatorProfiles)
        .innerJoin(users, eq(users.id, creatorProfiles.userId))
        .where(kind ? eq(creatorProfiles.profileKind, kind) : undefined)
        .orderBy(desc(creatorProfiles.createdAt));
      return {
        headers: [
          "nev", "felhasznalonev", "email", "kor", "nem", "varos", "megye", "tipus",
          "kategoriak", "szerepkorok", "szakteruletek", "nyelvek", "weboldal",
          "instagram_url", "instagram_kovetok", "tiktok_url", "tiktok_kovetok",
          "youtube_url", "youtube_feliratkozok", "facebook_url", "facebook_kovetok",
          "hitelesitett", "kiemelt", "admin_kiemelt", "atlag_ertekeles", "ertekelesek", "regisztralt",
        ],
        rows: r.map((c) => [
          c.displayName, c.username, c.email, ageOf(c.birthDate, c.age), genderLabel(c.gender),
          c.city, c.county, c.profileKind === "professional" ? "Kreatív szakember" : "UGC",
          c.categories, c.roles, c.specialties, c.languages, c.website,
          c.igUrl, c.ig, c.ttUrl, c.tt, c.ytUrl, c.yt, c.fbUrl, c.fb,
          c.verified, c.featured, c.adminFeatured, c.rating, c.reviewCount, c.createdAt,
        ]),
      };
    }
    case "brands": {
      const r = await db
        .select({
          companyName: brandProfiles.companyName, email: users.email,
          website: brandProfiles.websiteUrl, industry: brandProfiles.industry,
          taxNumber: brandProfiles.taxNumber, rating: brandProfiles.averageRating,
          reviewCount: brandProfiles.reviewCount, createdAt: brandProfiles.createdAt,
        })
        .from(brandProfiles)
        .innerJoin(users, eq(users.id, brandProfiles.userId))
        .orderBy(desc(brandProfiles.createdAt));
      return {
        headers: ["ceg", "email", "weboldal", "iparag", "adoszam", "atlag_ertekeles", "ertekelesek", "regisztralt"],
        rows: r.map((b) => [b.companyName, b.email, b.website, b.industry, b.taxNumber, b.rating, b.reviewCount, b.createdAt]),
      };
    }
    case "ads": {
      const r = await db
        .select({
          title: ads.title, status: ads.status, brandName: brandProfiles.companyName,
          budgetMin: ads.budgetMinHuf, budgetMax: ads.budgetMaxHuf,
          deadline: ads.deadline, applications: ads.applicationCount,
          featured: ads.isFeatured, createdAt: ads.createdAt,
        })
        .from(ads)
        .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
        .orderBy(desc(ads.createdAt));
      return {
        headers: ["cim", "statusz", "marka", "budzse_min", "budzse_max", "hatarido", "palyazatok", "kiemelt", "letrehozva"],
        rows: r.map((a) => [a.title, a.status, a.brandName, a.budgetMin, a.budgetMax, a.deadline, a.applications, a.featured, a.createdAt]),
      };
    }
    case "reviews": {
      const r = await db
        .select({
          brandName: brandProfiles.companyName, creatorName: creatorProfiles.displayName,
          overall: reviews.overallRating, text: reviews.text,
          hidden: reviews.hidden, createdAt: reviews.createdAt,
        })
        .from(reviews)
        .innerJoin(brandProfiles, eq(brandProfiles.id, reviews.brandId))
        .innerJoin(creatorProfiles, eq(creatorProfiles.id, reviews.creatorId))
        .orderBy(desc(reviews.createdAt));
      return {
        headers: ["marka", "tartalomgyarto", "ertekeles", "szoveg", "rejtett", "datum"],
        rows: r.map((v) => [v.brandName, v.creatorName, v.overall, v.text, v.hidden, v.createdAt]),
      };
    }
    case "newsletter": {
      const r = await db
        .select({
          email: newsletterSubscribers.email,
          source: newsletterSubscribers.source,
          createdAt: newsletterSubscribers.createdAt,
        })
        .from(newsletterSubscribers)
        .orderBy(desc(newsletterSubscribers.createdAt));
      return {
        headers: ["email", "forras", "feliratkozott"],
        rows: r.map((s) => [s.email, s.source, s.createdAt]),
      };
    }
    default:
      return null;
  }
}

export async function GET(req: Request) {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") {
    return new Response("Unauthorized", { status: 403 });
  }

  const type = new URL(req.url).searchParams.get("type") ?? "";
  const data = await build(type);
  if (!data) return new Response("Ismeretlen export típus", { status: 400 });

  const csv = toCsv(data.headers, data.rows);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="creatorz-${type}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
