import { Settings } from "lucide-react";
import { getAllSettings } from "@/lib/settings";
import { AdminSettingsForm } from "@/components/admin/admin-settings-form";
import { SecuritySettingsCard } from "@/components/shared/security-settings-card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const metadata = { title: "Admin — Beállítások" };

export default async function AdminSettingsPage() {
  const settings = await getAllSettings();
  return (
    <div className="space-y-6">
      <AdminPageHeader title="Beállítások" icon={Settings} description="Platform-kapcsolók, árazás és biztonság" />
      <SecuritySettingsCard />
      <AdminSettingsForm initial={settings} />
    </div>
  );
}
