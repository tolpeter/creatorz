import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { MfaForm } from "@/components/auth/mfa-form";

export const metadata = { title: "Kétlépcsős azonosítás" };

export default function MfaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-2 rounded-2xl border bg-white p-6 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Kétlépcsős azonosítás betöltése...
        </div>
      }
    >
      <MfaForm />
    </Suspense>
  );
}
