import { redirect } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { Database } from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import {
  GENDER_OPTIONS,
  PROFESSIONAL_ROLES,
  HAIR_COLOR_LABELS,
  MODEL_TYPE_LABELS,
} from "@/lib/constants";
import { DatabaseSection } from "@/components/admin/database-section";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { formatHuDate, formatNumber } from "@/lib/utils/format";

export const metadata = { title: "Admin — Adatbázis" };

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
  return storedAge && storedAge > 0 ? String(storedAge) : "—";
}

const genderLabel = (g: string | null) =>
  GENDER_OPTIONS.find((o) => o.value === g)?.label ?? "—";

const roleLabels = (roles: string[] | null) =>
  (roles ?? [])
    .map((r) => PROFESSIONAL_ROLES.find((x) => x.value === r)?.label ?? r)
    .join(", ");

const PREVIEW = 300;

export default async function AdminDatabasePage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const creatorCols = {
    name: creatorProfiles.displayName,
    email: users.email,
    birthDate: creatorProfiles.birthDate,
    age: creatorProfiles.age,
    gender: creatorProfiles.gender,
    city: creatorProfiles.city,
    roles: creatorProfiles.professionalRoles,
    website: creatorProfiles.websiteUrl,
    ig: creatorProfiles.instagramFollowers,
    tt: creatorProfiles.tiktokFollowers,
    createdAt: creatorProfiles.createdAt,
  };

  const modelCols = {
    name: creatorProfiles.displayName,
    email: users.email,
    birthDate: creatorProfiles.birthDate,
    age: creatorProfiles.age,
    gender: creatorProfiles.gender,
    city: creatorProfiles.city,
    model: creatorProfiles.modelAttributes,
    ig: creatorProfiles.instagramFollowers,
    tt: creatorProfiles.tiktokFollowers,
    createdAt: creatorProfiles.createdAt,
  };

  const ugcCreatorWhere = and(
    eq(creatorProfiles.profileKind, "ugc"),
    eq(creatorProfiles.creatorType, "ugc"),
  );

  const [ugc, influencers, models, pros, brands, counts, brandCountRows] = await Promise.all([
    db
      .select(creatorCols)
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(ugcCreatorWhere)
      .orderBy(desc(creatorProfiles.createdAt))
      .limit(PREVIEW),
    db
      .select(creatorCols)
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(eq(creatorProfiles.creatorType, "influencer"))
      .orderBy(desc(creatorProfiles.createdAt))
      .limit(PREVIEW),
    db
      .select(modelCols)
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(eq(creatorProfiles.creatorType, "model"))
      .orderBy(desc(creatorProfiles.createdAt))
      .limit(PREVIEW),
    db
      .select(creatorCols)
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(eq(creatorProfiles.profileKind, "professional"))
      .orderBy(desc(creatorProfiles.createdAt))
      .limit(PREVIEW),
    db
      .select({
        companyName: brandProfiles.companyName,
        email: users.email,
        industry: brandProfiles.industry,
        website: brandProfiles.websiteUrl,
        taxNumber: brandProfiles.taxNumber,
        createdAt: brandProfiles.createdAt,
      })
      .from(brandProfiles)
      .innerJoin(users, eq(users.id, brandProfiles.userId))
      .orderBy(desc(brandProfiles.createdAt))
      .limit(PREVIEW),
    db
      .select({
        ugc: sql<number>`count(*) filter (where ${creatorProfiles.profileKind} = 'ugc' and ${creatorProfiles.creatorType} = 'ugc')::int`,
        inf: sql<number>`count(*) filter (where ${creatorProfiles.creatorType} = 'influencer')::int`,
        model: sql<number>`count(*) filter (where ${creatorProfiles.creatorType} = 'model')::int`,
        pro: sql<number>`count(*) filter (where ${creatorProfiles.profileKind} = 'professional')::int`,
      })
      .from(creatorProfiles),
    db.select({ n: sql<number>`count(*)::int` }).from(brandProfiles),
  ]);

  const ugcCount = counts[0]?.ugc ?? 0;
  const infCount = counts[0]?.inf ?? 0;
  const modelCount = counts[0]?.model ?? 0;
  const proCount = counts[0]?.pro ?? 0;
  const brandCount = brandCountRows[0]?.n ?? 0;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Adatbázis"
        icon={Database}
        description="Teljes, letölthető adatbázis típusonként: UGC, influenszerek, modellek, kreatív szakemberek és márkák. Nyisd le egy törzset, és szűrj bármely mezőre."
      />

      <DatabaseSection
        title="UGC tartalomgyártók"
        iconKey="ugc"
        count={ugcCount}
        exportType="creators-ugc"
        previewLimit={PREVIEW}
        columns={["Név", "Email", "Kor", "Nem", "Város", "Instagram", "TikTok", "Weboldal", "Regisztrált"]}
        rows={ugc.map((c) => [
          c.name,
          c.email,
          ageOf(c.birthDate, c.age),
          genderLabel(c.gender),
          c.city ?? "—",
          c.ig ? formatNumber(c.ig) : "—",
          c.tt ? formatNumber(c.tt) : "—",
          c.website ?? "—",
          formatHuDate(c.createdAt),
        ])}
      />

      <DatabaseSection
        title="Influenszerek"
        iconKey="influencer"
        count={infCount}
        exportType="creators-influencer"
        previewLimit={PREVIEW}
        columns={["Név", "Email", "Kor", "Nem", "Város", "Instagram", "TikTok", "Weboldal", "Regisztrált"]}
        rows={influencers.map((c) => [
          c.name,
          c.email,
          ageOf(c.birthDate, c.age),
          genderLabel(c.gender),
          c.city ?? "—",
          c.ig ? formatNumber(c.ig) : "—",
          c.tt ? formatNumber(c.tt) : "—",
          c.website ?? "—",
          formatHuDate(c.createdAt),
        ])}
      />

      <DatabaseSection
        title="Modellek"
        iconKey="model"
        count={modelCount}
        exportType="creators-model"
        previewLimit={PREVIEW}
        columns={["Név", "Email", "Kor", "Nem", "Város", "Magasság", "Hajszín", "Modell-típus", "Instagram", "TikTok", "Regisztrált"]}
        rows={models.map((c) => {
          const m = c.model ?? {};
          return [
            c.name,
            c.email,
            ageOf(c.birthDate, c.age),
            genderLabel(c.gender),
            c.city ?? "—",
            m.heightCm ? `${m.heightCm} cm` : "—",
            m.hairColor ? HAIR_COLOR_LABELS[m.hairColor] ?? m.hairColor : "—",
            (m.modelTypes ?? []).map((t) => MODEL_TYPE_LABELS[t] ?? t).join(", ") || "—",
            c.ig ? formatNumber(c.ig) : "—",
            c.tt ? formatNumber(c.tt) : "—",
            formatHuDate(c.createdAt),
          ];
        })}
      />

      <DatabaseSection
        title="Kreatív szakemberek"
        iconKey="pro"
        count={proCount}
        exportType="creators-pro"
        previewLimit={PREVIEW}
        columns={["Név", "Email", "Kor", "Nem", "Város", "Szerepkörök", "Weboldal", "Regisztrált"]}
        rows={pros.map((c) => [
          c.name,
          c.email,
          ageOf(c.birthDate, c.age),
          genderLabel(c.gender),
          c.city ?? "—",
          roleLabels(c.roles) || "—",
          c.website ?? "—",
          formatHuDate(c.createdAt),
        ])}
      />

      <DatabaseSection
        title="Márkák"
        iconKey="brand"
        count={brandCount}
        exportType="brands"
        previewLimit={PREVIEW}
        columns={["Cégnév", "Email", "Iparág", "Weboldal", "Adószám", "Regisztrált"]}
        rows={brands.map((b) => [
          b.companyName,
          b.email,
          b.industry ?? "—",
          b.website ?? "—",
          b.taxNumber ?? "—",
          formatHuDate(b.createdAt),
        ])}
      />
    </div>
  );
}
