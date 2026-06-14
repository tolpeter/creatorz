import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { MailCheck } from "lucide-react";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser, dashboardPathForRole } from "@/lib/auth";
import { ResendVerificationButton } from "@/components/auth/resend-verification-button";
import { LogoutButton } from "@/components/shared/logout-button";

export const metadata = { title: "Email megerősítése" };

export default async function VerifyEmailPage() {
  const current = await getCurrentUser();
  // Nincs bejelentkezve → küldjük bejelentkezni
  if (!current?.dbUser) redirect("/login");

  // Lekérdezzük a friss verifikációs állapotot (a getCurrentUser cache-elt
  // dbUser-e nem feltétlen tartalmazza az új email_verified mezőt).
  const [row] = await db
    .select({ emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.id, current.dbUser.id))
    .limit(1);

  if (row?.emailVerified) {
    redirect(dashboardPathForRole(current.dbUser.role));
  }

  return (
    <div className="animate-slide-up w-full max-w-md rounded-3xl border border-black/10 bg-white p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.18)]">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f0f4e5]">
        <MailCheck className="h-8 w-8 text-[#4d7c0f]" />
      </span>
      <h1 className="mt-4 text-2xl font-black">Ellenőrizd az email fiókod</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Küldtünk egy megerősítő linket a(z){" "}
        <strong className="text-foreground">{current.authUser.email}</strong> címre.
        Kattints rá az emailben a fiókod aktiválásához.
      </p>

      <div className="mt-6 space-y-2">
        <ResendVerificationButton />
        <p className="text-xs text-muted-foreground">
          Nem kaptad meg? Nézd meg a Spam mappát is, vagy küldd újra a fenti gombbal.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2 border-t pt-5 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Vissza a főoldalra
        </Link>
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
