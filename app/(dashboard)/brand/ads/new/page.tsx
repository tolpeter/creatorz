import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentBrand } from "@/lib/auth";
import { AdForm } from "@/components/brand/ad-form";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Új hirdetés" };

export default async function NewAdPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  const incomplete = !brand.profile.taxNumber || !brand.profile.address;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Új hirdetés feladása</h1>
      {incomplete && (
        <div className="rounded-lg border border-accent bg-accent/10 p-4 text-sm">
          Hirdetésfeladáshoz előbb töltsd ki az <strong>adószámot</strong> és a{" "}
          <strong>székhelyet</strong> a Cég profilban.{" "}
          <Button asChild variant="link" className="h-auto p-0">
            <Link href="/brand/profile">Ugrás a profilhoz</Link>
          </Button>
        </div>
      )}
      <AdForm />
    </div>
  );
}
