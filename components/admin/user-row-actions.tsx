"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setUserSuspended, setUserRole } from "@/app/actions/admin";

export function UserRowActions({
  userId,
  role,
  suspended,
}: {
  userId: string;
  role: string;
  suspended: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function run(fn: () => Promise<{ error?: string }>) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else {
        toast.success("Mentve");
        router.refresh();
      }
    });
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
        variant={suspended ? "outline" : "destructive"}
        disabled={pending}
        onClick={() => run(() => setUserSuspended(userId, !suspended))}
      >
        {suspended ? "Visszaállítás" : "Felfüggesztés"}
      </Button>
    </div>
  );
}
