import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { collaborations, creatorProfiles, brandProfiles } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ReviewForm } from "@/components/review-form";

export const metadata = { title: "Értékelés" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const rows = await db
    .select({
      status: collaborations.status,
      creatorName: creatorProfiles.displayName,
      brandName: brandProfiles.companyName,
    })
    .from(collaborations)
    .innerJoin(creatorProfiles, eq(creatorProfiles.id, collaborations.creatorId))
    .innerJoin(brandProfiles, eq(brandProfiles.id, collaborations.brandId))
    .where(eq(collaborations.reviewToken, token))
    .limit(1);

  const collab = rows[0];
  const valid = collab && collab.status === "review_pending";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <Link href="/" className="mb-2 text-xl font-bold tracking-tight">
            Creatorz
          </Link>
          {valid ? (
            <>
              <CardTitle>Hogyan ment a közös munka?</CardTitle>
              <CardDescription>
                {collab.brandName} → {collab.creatorName} értékelése
              </CardDescription>
            </>
          ) : (
            <CardTitle>Érvénytelen vagy lejárt link</CardTitle>
          )}
        </CardHeader>
        <CardContent>
          {valid ? (
            <ReviewForm token={token} creatorName={collab.creatorName} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Ez az értékelési link már nem érvényes (lehet, hogy már kitöltötted, vagy
              lejárt).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
