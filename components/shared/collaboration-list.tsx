import { Handshake } from "lucide-react";
import { CollaborationCard } from "@/components/shared/collaboration-card";
import { getMyCollaborations } from "@/app/actions/collaborations";

/** Az aktuális felhasználó együttműködéseinek listája (brand + creator közös). */
export async function CollaborationList() {
  const items = await getMyCollaborations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Együttműködések</h1>
        <p className="text-muted-foreground">
          Az elfogadott pályázatokból indult közös munkák állapota.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-muted-foreground">
          <Handshake className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
          Még nincs aktív együttműködésed. Egy elfogadott pályázat után itt jelenik meg.
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {items.map((c) => (
            <CollaborationCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
