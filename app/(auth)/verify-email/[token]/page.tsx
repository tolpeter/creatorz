import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, MailX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/app/actions/auth";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";

export const metadata = { title: "Email megerősítése" };

export default async function VerifyEmailTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await verifyEmailToken(token);

  // Sikeres megerősítés — ha be van lépve, redirect a dashboardra
  if (res.success) {
    const current = await getCurrentUser();
    if (current?.dbUser) {
      const target = dashboardPathForRole(current.dbUser.role);
      return (
        <div className="animate-slide-up w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/15">
            <BadgeCheck className="h-9 w-9 text-[#4d7c0f]" />
          </span>
          <h1 className="mt-4 text-2xl font-black">
            {res.alreadyVerified ? "Már megerősítve" : "Sikeres megerősítés! 🎉"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {res.alreadyVerified
              ? "Az emailcímed már korábban meg lett erősítve."
              : "Köszönjük! Az emailcímed mostantól megerősítve, használhatod a teljes Creatorz felületét."}
          </p>
          <Button
            asChild
            className="mt-6 h-11 w-full bg-[#0a0a0a] font-bold text-white hover:bg-accent hover:text-black"
          >
            <Link href={target}>
              Tovább az irányítópultra <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      );
    }
    // Nincs bejelentkezve → menjen belépésre
    redirect("/login?verified=1");
  }

  // Hiba — érvénytelen / lejárt token
  return (
    <div className="animate-slide-up w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
        <MailX className="h-9 w-9 text-red-600" />
      </span>
      <h1 className="mt-4 text-2xl font-black">A link érvénytelen</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        {res.error ?? "A megerősítő link érvénytelen vagy lejárt."}
      </p>
      <div className="mt-6 space-y-2">
        <ResendVerificationButton />
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Bejelentkezés</Link>
        </Button>
      </div>
    </div>
  );
}
