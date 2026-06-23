import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentCreator } from "@/lib/auth";
import { getCollaborationDetail } from "@/app/actions/collaborations";
import { CollaborationWorkspace } from "@/components/shared/collaboration-workspace";

export const metadata = { title: "Együttműködés" };

export default async function CreatorCollaborationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const c = await getCollaborationDetail(id);
  if (!c || c.viewerRole !== "creator") notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/creator/collaborations">
          <ArrowLeft className="h-4 w-4" /> Vissza az együttműködésekhez
        </Link>
      </Button>
      <CollaborationWorkspace c={c} />
    </div>
  );
}
