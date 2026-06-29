import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { dashboardPathForRole } from "@/lib/auth";
import { GoogleRolePicker } from "@/components/auth/google-role-picker";
import { GoogleAutoComplete } from "@/components/auth/google-autocomplete";

export const metadata = { title: "Regisztráció befejezése" };
export const dynamic = "force-dynamic";

export default async function GoogleRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; profileKind?: string; creatorType?: string }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Nincs bejelentkezve → vissza a belépéshez.
  if (!user) redirect("/login");

  // Már van app fiók → nem itt a helye, irány a vezérlőpult.
  const [row] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.authId, user.id))
    .limit(1);
  if (row) redirect(dashboardPathForRole(row.role));

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const name = String(meta.full_name || meta.name || "").trim();

  // Ha a Google-gomb hozta a szerepkört, automatikusan befejezzük (nincs választó).
  const presetRole = sp.role === "creator" || sp.role === "brand" ? sp.role : null;
  if (presetRole) {
    return (
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-5 py-12">
        <GoogleAutoComplete
          role={presetRole}
          profileKind={sp.profileKind === "professional" ? "professional" : "ugc"}
          creatorType={
            sp.creatorType === "influencer" || sp.creatorType === "model"
              ? sp.creatorType
              : "ugc"
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-lg flex-col justify-center px-5 py-12">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black sm:text-3xl">Még egy lépés</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {name ? <>Üdv, <strong>{name}</strong>! </> : null}
          A Google-fiókod összekapcsolva. Válaszd ki, milyen fiókot szeretnél —
          a neved és emailed már megvan, csak a profilod kell befejezned.
        </p>
      </div>
      <GoogleRolePicker />
    </div>
  );
}
