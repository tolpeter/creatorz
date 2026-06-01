import { Mail } from "lucide-react";

export const metadata = { title: "Kapcsolat" };

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
      <h1 className="text-3xl font-bold">Kapcsolat</h1>
      <p className="text-muted-foreground">
        Kérdésed van? Írj nekünk, igyekszünk gyorsan válaszolni.
      </p>
      <a
        href="mailto:info@creatorz.hu"
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 font-medium hover:bg-muted"
      >
        <Mail className="h-4 w-4" /> info@creatorz.hu
      </a>
    </div>
  );
}
