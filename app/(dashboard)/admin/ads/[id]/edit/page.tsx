import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ads, brandProfiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdForm, type AdFormInitial } from "@/components/brand/ad-form";
import { AdminBrandLogo } from "@/components/admin/admin-brand-logo";

export const metadata = { title: "Admin — Kampány szerkesztése" };

export default async function AdminEditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (current?.dbUser?.role !== "admin") redirect("/dashboard");

  const [ad] = await db
    .select({
      ad: ads,
      brandId: brandProfiles.id,
      brandName: brandProfiles.companyName,
      brandLogo: brandProfiles.logoUrl,
    })
    .from(ads)
    .innerJoin(brandProfiles, eq(brandProfiles.id, ads.brandId))
    .where(eq(ads.id, id))
    .limit(1);
  if (!ad) notFound();

  const a = ad.ad;
  const initial: AdFormInitial = {
    title: a.title,
    description: a.description,
    categories: a.categories ?? [],
    targetKinds: a.targetKinds ?? ["ugc"],
    contentType: a.contentType,
    collaborationType: a.collaborationType,
    coverUrl: a.coverUrl,
    budgetMin: a.budgetMinHuf != null ? String(a.budgetMinHuf) : "",
    budgetMax: a.budgetMaxHuf != null ? String(a.budgetMaxHuf) : "",
    budgetPublic: a.budgetPublic,
    anonymous: a.anonymous,
    seekingCount: a.seekingCount ?? null,
    deadline: a.deadline ? new Date(a.deadline).toISOString().slice(0, 10) : "",
    location: a.location ?? "",
    usageRights: a.usageRights,
    links: a.referenceLinks ?? [],
  };

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/admin/ads">
          <ArrowLeft className="h-3.5 w-3.5" />
          Vissza a kampányokhoz
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Márka logó — {ad.brandName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Ez a logó jelenik meg a publikus hirdetés-kártyán a márka avatarjaként.
          </p>
          <AdminBrandLogo brandId={ad.brandId} initialUrl={ad.brandLogo} />
        </CardContent>
      </Card>

      <AdForm adId={id} initial={initial} adminEdit />
    </div>
  );
}
