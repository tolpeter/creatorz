import { getAllSettings } from "@/lib/settings";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { SecuritySettingsCard } from "@/components/shared/security-settings-card";

export const metadata = { title: "Admin — Beállítások" };

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beállítások</h1>
      <SecuritySettingsCard />
      <AdminSettingsForm initial={settings} />
    </div>
  );
}
