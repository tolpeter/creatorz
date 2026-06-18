"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  setUserSuspended,
  setUserRole,
  setUserCanSeeViewers,
  deleteUser,
} from "@/app/actions/admin";

export function UserRowActions({
  userId,
  role,
  suspended,
  canSeeViewers = false,
  label,
}: {
  userId: string;
  role: string;
  suspended: boolean;
  canSeeViewers?: boolean;
  /** Megjelenítendő név/email a törlés-megerősítéshez. */
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>, okMsg = "Mentve") {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success(okMsg);
        router.refresh();
      }
    });
  }

  function confirmDelete() {
    const who = label ? `\n\n${label}` : "";
    const ok = window.confirm(
      `Biztosan VÉGLEGESEN törlöd ezt a felhasználót?${who}\n\nEz törli a fiókot, a profilját, hirdetéseit és minden hozzá tartozó adatot. A művelet nem visszavonható!`,
    );
    if (!ok) return;
    run(() => deleteUser(userId), "Felhasználó törölve");
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        defaultValue={role}
        onValueChange={(v) => run(() => setUserRole(userId, v))}
      >
        <SelectTrigger className="h-8 w-[110px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="creator">creator</SelectItem>
          <SelectItem value="brand">brand</SelectItem>
          <SelectItem value="admin">admin</SelectItem>
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant={suspended ? "outline" : "secondary"}
        disabled={pending}
        onClick={() => run(() => setUserSuspended(userId, !suspended))}
      >
        {suspended ? "Visszaállítás" : "Felfüggesztés"}
      </Button>
      <Button
        size="sm"
        variant={canSeeViewers ? "default" : "outline"}
        disabled={pending}
        title="Láthatja, KIK nézték meg a profilját / hirdetését"
        onClick={() =>
          run(
            () => setUserCanSeeViewers(userId, !canSeeViewers),
            canSeeViewers ? "Megtekintők elrejtve" : "Megtekintők láthatóvá téve",
          )
        }
      >
        <Eye className="h-3.5 w-3.5" />
        {canSeeViewers ? "Megtekintők: be" : "Megtekintők: ki"}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={pending || role === "admin"}
        title={role === "admin" ? "Admin nem törölhető" : "Végleges törlés"}
        onClick={confirmDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
