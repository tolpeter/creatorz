import { DeleteAccountCard } from "@/components/shared/delete-account-card";
import { SecuritySettingsCard } from "@/components/shared/security-settings-card";
import { EmailPrefsCard } from "@/components/shared/email-prefs-card";
import { getMyEmailPrefs } from "@/app/actions/email-prefs";

export const metadata = { title: "Beállítások" };
export const dynamic = "force-dynamic";

export default async function CreatorSettingsPage() {
  const emailPrefs = await getMyEmailPrefs();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Beállítások</h1>
      <EmailPrefsCard initial={emailPrefs} />
      <SecuritySettingsCard />
      <DeleteAccountCard />
    </div>
  );
}
