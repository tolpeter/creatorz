import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BrandOnboardingPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Márka onboarding</CardTitle>
        <CardDescription>
          Az egyszerű márka-regisztrációs űrlap a 4. fázisban érkezik. Addig is
          beléphetsz a dashboardodra.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild className="w-full">
          <Link href="/brand">Tovább a dashboardra</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
