import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-7xl font-bold text-accent">404</h1>
      <h2 className="text-2xl font-bold">Az oldal nem található</h2>
      <p className="text-muted-foreground">
        Lehet, hogy a link elavult, vagy az oldal eltávolításra került.
      </p>
      <Button asChild>
        <Link href="/">Vissza a főoldalra</Link>
      </Button>
    </div>
  );
}
