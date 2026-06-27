import Link from "next/link";
import { and, desc, eq, gt, ilike, isNull, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreatorAdminActions } from "@/components/admin/creator-admin-actions";
import { AdminMessageButton } from "@/components/admin/admin-message-button";
import { ExportButton } from "@/components/admin/export-button";
import { AdminSearch } from "@/components/admin/admin-search";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { UserCheck } from "lucide-react";
import { CREATOR_TYPE_LABELS } from "@/lib/constants";

export const metadata = { title: "Admin — Alkotók" };

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const status = sp.status ?? "";
  const type = sp.type ?? "";

  const conditions: SQL[] = [];

  // Típus-szűrő: tartalomgyártó / influenszer / modell / kreatív szakember
  if (type === "ugc") {
    conditions.push(eq(creatorProfiles.profileKind, "ugc"));
    conditions.push(eq(creatorProfiles.creatorType, "ugc"));
  } else if (type === "influencer" || type === "model") {
    conditions.push(eq(creatorProfiles.profileKind, "ugc"));
    conditions.push(eq(creatorProfiles.creatorType, type));
  } else if (type === "professional") {
    conditions.push(eq(creatorProfiles.profileKind, "professional"));
  }
  if (q) {
    const like = `%${q}%`;
    conditions.push(
      or(
        ilike(creatorProfiles.displayName, like),
        ilike(creatorProfiles.username, like),
        ilike(users.email, like),
      )!,
    );
  }
  if (status === "pending") conditions.push(eq(users.approved, false));
  if (status === "approved") conditions.push(eq(users.approved, true));
  if (status === "verified") conditions.push(eq(creatorProfiles.verified, true));
  if (status === "featured")
    conditions.push(
      or(
        eq(creatorProfiles.isAdminFeatured, true),
        and(
          eq(creatorProfiles.isFeatured, true),
          or(
            isNull(creatorProfiles.featuredUntil),
            gt(creatorProfiles.featuredUntil, new Date()),
          ),
        ),
      )!,
    );

  const baseWhere = conditions.length ? and(...conditions) : undefined;
  const LIST_LIMIT = 500;

  const rows = await db
    .select({
      creatorId: creatorProfiles.id,
      userId: creatorProfiles.userId,
      username: creatorProfiles.username,
      displayName: creatorProfiles.displayName,
      avatarUrl: creatorProfiles.avatarUrl,
      reviewCount: creatorProfiles.reviewCount,
      averageRating: creatorProfiles.averageRating,
      isAdminFeatured: creatorProfiles.isAdminFeatured,
      isFeatured: creatorProfiles.isFeatured,
      featuredUntil: creatorProfiles.featuredUntil,
      verified: creatorProfiles.verified,
      approved: users.approved,
      onboardingCompleted: creatorProfiles.onboardingCompleted,
      profileKind: creatorProfiles.profileKind,
      creatorType: creatorProfiles.creatorType,
      createdAt: creatorProfiles.createdAt,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(baseWhere)
    .orderBy(desc(creatorProfiles.createdAt))
    .limit(LIST_LIMIT);

  // Valódi összegek (nem a lekért sorok száma) — a szűrőt is figyelembe véve.
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(baseWhere);
  const [{ pendingTotal }] = await db
    .select({ pendingTotal: sql<number>`count(*)::int` })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .where(baseWhere ? and(baseWhere, eq(users.approved, false)) : eq(users.approved, false));

  const now = new Date();
  const isCurrentlyFeatured = (r: (typeof rows)[number]) =>
    r.isAdminFeatured ||
    (r.isFeatured && (!r.featuredUntil || r.featuredUntil > now));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Alkotók"
        icon={UserCheck}
        description={`${total} találat · ${pendingTotal} jóváhagyásra vár${total > rows.length ? ` · első ${rows.length} látható` : ""}`}
        action={<ExportButton type="creators" />}
      />

      <AdminSearch
        q={q}
        placeholder="Keresés név, felhasználónév vagy email alapján…"
        basePath="/admin/creators"
        filterParam="status"
        activeFilter={status}
        filters={[
          { label: "Mind", value: "" },
          { label: "Jóváhagyásra vár", value: "pending" },
          { label: "Jóváhagyott", value: "approved" },
          { label: "Hitelesített", value: "verified" },
          { label: "Kiemelt", value: "featured" },
        ]}
        filterParam2="type"
        activeFilter2={type}
        filters2={[
          { label: "Összes típus", value: "" },
          { label: "Tartalomgyártó", value: "ugc" },
          { label: "Influenszer", value: "influencer" },
          { label: "Modell", value: "model" },
          { label: "Kreatív szakember", value: "professional" },
        ]}
      />

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nincs a keresésnek megfelelő alkotó.
        </p>
      ) : (
      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.creatorId}
            className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={r.avatarUrl ?? undefined} />
                <AvatarFallback>{r.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/creators/${r.username}`} target="_blank" className="font-medium hover:underline">
                  {r.displayName}
                </Link>
                <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    @{r.username} · {r.reviewCount} értékelés · {r.averageRating ?? "—"}★
                  </span>
                  <Badge className="bg-foreground/10 text-foreground">
                    {r.profileKind === "professional"
                      ? "Kreatív szakember"
                      : CREATOR_TYPE_LABELS[r.creatorType] ?? "Tartalomgyártó"}
                  </Badge>
                  {!r.onboardingCompleted ? (
                    <Badge className="bg-red-500/15 text-red-600 dark:text-red-400">
                      Befejezetlen regisztráció
                    </Badge>
                  ) : (
                    !r.approved && (
                      <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
                        Jóváhagyásra vár
                      </Badge>
                    )
                  )}
                  {r.verified && (
                    <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-400">
                      Hitelesített
                    </Badge>
                  )}
                  {isCurrentlyFeatured(r) && (
                    <Badge className="bg-accent/20 text-[#3f6212]">Kiemelt</Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AdminMessageButton toUserId={r.userId} name={r.displayName} />
              <CreatorAdminActions
                userId={r.userId}
                creatorId={r.creatorId}
                approved={r.approved}
                adminFeatured={r.isAdminFeatured}
                verified={r.verified}
              />
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
