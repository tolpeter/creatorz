import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { creatorProfiles, users } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CreatorAdminActions } from "@/components/admin/creator-admin-actions";

export const metadata = { title: "Admin — Tartalomgyártók" };

export default async function AdminCreatorsPage() {
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
      approved: users.approved,
      createdAt: creatorProfiles.createdAt,
    })
    .from(creatorProfiles)
    .innerJoin(users, eq(users.id, creatorProfiles.userId))
    .orderBy(desc(creatorProfiles.createdAt))
    .limit(200);

  const pending = rows.filter((r) => !r.approved);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tartalomgyártók</h1>
        <p className="text-muted-foreground">
          {rows.length} tartalomgyártó · {pending.length} jóváhagyásra vár
        </p>
      </div>

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
                <p className="text-xs text-muted-foreground">
                  @{r.username} · {r.reviewCount} értékelés · {r.averageRating ?? "—"}★
                  {!r.approved && (
                    <Badge className="ml-2 bg-yellow-500/15 text-yellow-700 dark:text-yellow-400">
                      Jóváhagyásra vár
                    </Badge>
                  )}
                </p>
              </div>
            </div>
            <CreatorAdminActions
              userId={r.userId}
              creatorId={r.creatorId}
              approved={r.approved}
              adminFeatured={r.isAdminFeatured}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
