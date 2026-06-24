import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { ads } from "@/lib/db/schema";
import { getCurrentBrand } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { AdForm, type AdFormInitial } from "@/components/brand/ad-form";

export const metadata = { title: "Kampány szerkesztése" };

export default async function EditAdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const [ad] = await db
    .select()
    .from(ads)
    .where(and(eq(ads.id, id), eq(ads.brandId, brand.profile.id), isNull(ads.deletedAt)))
    .limit(1);
  if (!ad) notFound();

  const initial: AdFormInitial = {
    title: ad.title,
    description: ad.description,
    categories: ad.categories ?? [],
    targetKinds: ad.targetKinds ?? ["ugc"],
    contentType: ad.contentType,
    collaborationType: ad.collaborationType,
    coverUrl: ad.coverUrl,
    budgetMin: ad.budgetMinHuf != null ? String(ad.budgetMinHuf) : "",
    budgetMax: ad.budgetMaxHuf != null ? String(ad.budgetMaxHuf) : "",
    budgetPublic: ad.budgetPublic,
    anonymous: ad.anonymous,
    seekingCount: ad.seekingCount ?? null,
    deadline: ad.deadline ? new Date(ad.deadline).toISOString().slice(0, 10) : "",
    location: ad.location ?? "",
    usageRights: ad.usageRights,
    links: ad.referenceLinks ?? [],
  };

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/brand/ads/${id}`}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Vissza a kampányhoz
        </Link>
      </Button>
      <AdForm adId={id} initial={initial} />
    </div>
  );
}
