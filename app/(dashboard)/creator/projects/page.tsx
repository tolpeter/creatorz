import { getMyCreatorProjects } from "@/app/actions/creator-projects";
import { CreatorProjectsList } from "@/components/creator/creator-projects-list";

export const metadata = { title: "Közös projektek" };
export const dynamic = "force-dynamic";

export default async function CreatorProjectsPage() {
  const items = await getMyCreatorProjects();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Közös projektek</h1>
        <p className="text-muted-foreground">
          Más alkotókkal indított közös munkák (márka nélkül) — pl. fotós/operatőr + modell/influenszer.
        </p>
      </div>
      <CreatorProjectsList items={items} />
    </div>
  );
}
