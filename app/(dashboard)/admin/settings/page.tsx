import { getAllSettings } from "@/lib/settings";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export const metadata = { title: "Admin — Beállítások" };

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beállítások</h1>
      <AdminSettingsForm initial={settings} />
    </div>
  );
}
