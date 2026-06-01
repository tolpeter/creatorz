"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-2xl font-bold">Valami hiba történt</h2>
      <p className="text-muted-foreground">
        Sajnáljuk a kellemetlenséget. Próbáld újra.
      </p>
      <Button onClick={reset}>Újra próbálkozás</Button>
    </div>
  );
}
