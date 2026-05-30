import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
        Hamarosan
      </span>
      <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
        Creatorz
      </h1>
      <p className="text-balance max-w-xl text-lg text-muted-foreground">
        Magyar UGC tartalomgyártó és márka összekötő platform. Az alap
        infrastruktúra felépült — a funkciók a következő fázisokban érkeznek.
      </p>
      <div className="flex gap-3">
        <Button>Creatorként csatlakozom</Button>
        <Button variant="outline">Márkaként böngészek</Button>
      </div>
    </main>
  );
}
