import { DeleteAccountCard } from "@/components/shared/delete-account-card";
import { SecuritySettingsCard } from "@/components/shared/security-settings-card";

export const metadata = { title: "Beállítások" };

export default function CreatorSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beállítások</h1>
      <SecuritySettingsCard />
      <DeleteAccountCard />
    </div>
  );
}
