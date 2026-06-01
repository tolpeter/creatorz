import { DeleteAccountCard } from "@/components/shared/delete-account-card";

export const metadata = { title: "Beállítások" };

export default function BrandSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beállítások</h1>
      <DeleteAccountCard />
    </div>
  );
}
