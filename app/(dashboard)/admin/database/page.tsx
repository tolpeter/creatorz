import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { Database, UserCheck, Sparkles, Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { creatorProfiles, brandProfiles, users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { GENDER_OPTIONS, PROFESSIONAL_ROLES } from "@/lib/constants";
import { ExportButton } from "@/components/admin/export-button";
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

const PREVIEW = 60;

export default async function AdminDatabasePage() {
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const creatorCols = {
    name: creatorProfiles.displayName,
    username: creatorProfiles.username,
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

  const [ugc, pros, brands, counts] = await Promise.all([
    db
      .select(creatorCols)
      .from(creatorProfiles)
      .innerJoin(users, eq(users.id, creatorProfiles.userId))
      .where(eq(creatorProfiles.profileKind, "ugc"))
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
        ugc: sql<number>`count(*) filter (where ${creatorProfiles.profileKind} = 'ugc')::int`,
        pro: sql<number>`count(*) filter (where ${creatorProfiles.profileKind} = 'professional')::int`,
      })
      .from(creatorProfiles),
  ]);

  const brandCountRows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(brandProfiles);
  const brandCount = brandCountRows[0]?.n ?? 0;
  const ugcCount = counts[0]?.ugc ?? 0;
  const proCount = counts[0]?.pro ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <Database className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Adatbázis</h1>
          <p className="text-muted-foreground">
            Teljes, letölthető adatbázis külön a tartalomgyártókra, kreatív
            szakemberekre és a márkákra.
          </p>
        </div>
      </div>

      <DbSection
        icon={<UserCheck className="h-5 w-5" />}
        title="UGC tartalomgyártók"
        count={ugcCount}
        exportType="creators-ugc"
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

      <DbSection
        icon={<Sparkles className="h-5 w-5" />}
        title="Kreatív szakemberek"
        count={proCount}
        exportType="creators-pro"
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

      <DbSection
        icon={<Building2 className="h-5 w-5" />}
        title="Márkák"
        count={brandCount}
        exportType="brands"
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

function DbSection({
  icon,
  title,
  count,
  exportType,
  columns,
  rows,
}: {
  icon: React.ReactNode;
  title: string;
  count: number;
  exportType: "creators-ugc" | "creators-pro" | "brands";
  columns: string[];
  rows: (string | number)[][];
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-[#3f6212]">
            {icon}
          </span>
          <div>
            <h2 className="font-bold leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{count} rekord összesen</p>
          </div>
        </div>
        <ExportButton type={exportType} label="Teljes CSV letöltése" />
      </div>

      {rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">Nincs adat.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30 text-left">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="whitespace-nowrap px-3 py-2 font-semibold">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                  {r.map((cellValue, j) => (
                    <td key={j} className="whitespace-nowrap px-3 py-2">
                      {typeof cellValue === "string" && cellValue.length > 40
                        ? `${cellValue.slice(0, 40)}…`
                        : cellValue}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length >= PREVIEW && (
        <p className="border-t px-4 py-2 text-xs text-muted-foreground">
          Az előnézet az első {PREVIEW} rekordot mutatja — a teljes lista a CSV-ben.
        </p>
      )}
    </section>
  );
}
