import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getProjectDetail } from "@/app/actions/creator-projects";
import { CreatorProjectWorkspace } from "@/components/creator/creator-project-workspace";

export const metadata = { title: "Közös projekt" };
export const dynamic = "force-dynamic";

export default async function CreatorProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/creator/projects" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Vissza a közös projektekhez
      </Link>
      <CreatorProjectWorkspace p={detail} />
    </div>
  );
}
