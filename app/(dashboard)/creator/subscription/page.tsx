import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { Crown, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { subscriptions, featurePurchases } from "@/lib/db/schema";
import { getCurrentUser, getCurrentCreator } from "@/lib/auth";
import { getAllSettings } from "@/lib/settings";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHuf, formatHuDate } from "@/lib/utils/format";
import {
  SubscribeButton,
  PortalButton,
  FeatureButton,
} from "@/components/creator/billing-buttons";

export const metadata = { title: "Előfizetés" };

const STATUS_LABEL: Record<string, string> = {
  active: "Aktív",
  past_due: "Fizetés esedékes",
  canceled: "Lemondva",
  unpaid: "Kifizetetlen",
  incomplete: "Befejezetlen",
};

export default async function SubscriptionPage() {
  const current = await getCurrentUser();
  if (!current?.dbUser) redirect("/login");
  const creator = await getCurrentCreator();
  if (!creator) redirect("/login");

  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, current.dbUser.id))
    .limit(1);
  const sub = subRows[0];
  const hasActiveSub = sub && (sub.status === "active" || sub.status === "past_due");

  const features = await db
    .select()
    .from(featurePurchases)
    .where(eq(featurePurchases.creatorId, creator.profile.id))
    .orderBy(desc(featurePurchases.createdAt));

  const cfg = await getAllSettings();
  const MONTHLY = Number(cfg.creator_subscription_price_huf);
  const F7 = Number(cfg.feature_7day_price_huf);
  const F30 = Number(cfg.feature_30day_price_huf);
  const SUB_REQUIRED = cfg.creator_subscription_enabled === true;

  const isFeatured = creator.profile.isFeatured;
  const featuredUntil = creator.profile.featuredUntil;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Előfizetés és kiemelés</h1>

      {/* Előfizetés */}
      <Card>
        <CardHeader>
          <CardTitle>Havi előfizetés</CardTitle>
          <CardDescription>
            Profilod aktívan jelenik meg a Creatorz directoryban — {formatHuf(MONTHLY)}/hó
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasActiveSub ? (
            <>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/15 text-green-700 dark:text-green-400">
                  {STATUS_LABEL[sub!.status] ?? sub!.status}
                </Badge>
                {sub!.currentPeriodEnd && (
                  <span className="text-sm text-muted-foreground">
                    Következő esedékesség: {formatHuDate(sub!.currentPeriodEnd)}
                  </span>
                )}
              </div>
              <PortalButton />
            </>
          ) : SUB_REQUIRED ? (
            <SubscribeButton label={`Előfizetés indítása — ${formatHuf(MONTHLY)}/hó`} />
          ) : (
            <p className="text-sm text-muted-foreground">
              Az ingyenes regisztrációs időszak alatt nincs szükség előfizetésre. 🎉
            </p>
          )}
        </CardContent>
      </Card>

      {/* Kiemelés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-accent" /> Kiemelés vásárlása
          </CardTitle>
          <CardDescription>
            Profilod kiemelten, arany kerettel jelenik meg a böngészőben és a főoldalon.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isFeatured && featuredUntil && (
            <Badge className="bg-accent text-accent-foreground">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Kiemelt eddig: {formatHuDate(featuredUntil)}
            </Badge>
          )}
          <div className="flex flex-wrap gap-3">
            <FeatureButton type="7day" label={`7 napos kiemelés — ${formatHuf(F7)}`} />
            <FeatureButton type="30day" label={`30 napos kiemelés — ${formatHuf(F30)}`} primary />
          </div>
        </CardContent>
      </Card>

      {/* Vásárlási előzmények */}
      {features.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vásárlási előzmények</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {features.map((f) => (
                <div key={f.id} className="flex justify-between border-b pb-2 last:border-0">
                  <span>
                    Kiemelés ({f.type === "7day" ? "7 napos" : "30 napos"}) ·{" "}
                    {formatHuDate(f.createdAt)}
                  </span>
                  <span className="font-medium">{formatHuf(f.amountHuf)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
