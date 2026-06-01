import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Creatorz
            </Link>
            <Link
              href="/creators"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Creatorok
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {current?.dbUser ? (
              <Button asChild size="sm">
                <Link href="/dashboard">Irányítópult</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/login">Bejelentkezés</Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/register">Regisztráció</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
