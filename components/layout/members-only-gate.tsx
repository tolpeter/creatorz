import Link from "next/link";
import { ArrowRight, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Tagoknak fenntartott tartalom kapuja — bejelentkezés nélküli látogatóknak
 * jelenik meg a /creators és /ads oldalakon (ha az admin a publikus
 * böngészést kikapcsolta). Szép, ösztönző üzenet a száraz redirect helyett.
 */
export function MembersOnlyGate({
  title,
  description,
  next,
}: {
  title: string;
  description: string;
  next: string;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f4e5] text-[#4d7c0f] ring-1 ring-accent/30">
        <Lock className="h-7 w-7" />
      </span>

      <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-[#f0f4e5] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-[#3f6212]">
        <Sparkles className="h-3.5 w-3.5" />
        Csak tagoknak
      </span>

      <h1 className="text-balance text-2xl font-black sm:text-3xl">{title}</h1>
      <p className="mt-3 max-w-md text-pretty text-muted-foreground">
        {description}
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          asChild
          className="h-11 bg-[#0a0a0a] px-6 text-base font-semibold text-white transition-all hover:bg-accent hover:text-black"
        >
          <Link href="/register">
            Ingyenes regisztráció <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-11 px-6 text-base">
          <Link href={`/login?next=${encodeURIComponent(next)}`}>
            Már tag vagyok — belépek
          </Link>
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        A regisztráció pár perc, és teljesen ingyenes.
      </p>
    </div>
  );
}
