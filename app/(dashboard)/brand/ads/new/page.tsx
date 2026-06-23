import { redirect } from "next/navigation";
import { getCurrentBrand } from "@/lib/auth";
import { AdForm } from "@/components/brand/ad-form";

export const metadata = { title: "Új kampány" };

export default async function NewAdPage() {
  const brand = await getCurrentBrand();
  if (!brand) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Új kampány feladása</h1>
      <AdForm />
    </div>
  );
}
