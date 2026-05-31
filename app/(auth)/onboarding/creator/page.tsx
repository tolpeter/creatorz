import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreatorOnboardingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Creator onboarding</CardTitle>
        <CardDescription>
          A 4 lépéses profil-varázsló a 3. fázisban érkezik. Addig is
          beléphetsz a dashboardodra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/creator">Tovább a dashboardra</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
