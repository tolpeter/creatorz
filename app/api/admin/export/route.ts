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
    case "creators": {
      const r = await db
        .select({
          username: creatorProfiles.username, displayName: creatorProfiles.displayName,
          email: users.email, city: creatorProfiles.city, county: creatorProfiles.county,
          categories: creatorProfiles.categories,
          ig: creatorProfiles.instagramFollowers, tt: creatorProfiles.tiktokFollowers,
          verified: creatorProfiles.verified, rating: creatorProfiles.averageRating,
          reviewCount: creatorProfiles.reviewCount, createdAt: creatorProfiles.createdAt,
        })
        .from(creatorProfiles)
        .innerJoin(users, eq(users.id, creatorProfiles.userId))
        .orderBy(desc(creatorProfiles.createdAt));
      return {
        headers: ["felhasznalonev", "nev", "email", "varos", "megye", "kategoriak", "instagram", "tiktok", "hitelesitett", "atlag_ertekeles", "ertekelesek", "regisztralt"],
        rows: r.map((c) => [c.username, c.displayName, c.email, c.city, c.county, c.categories, c.ig, c.tt, c.verified, c.rating, c.reviewCount, c.createdAt]),
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
