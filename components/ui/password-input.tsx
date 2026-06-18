"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Jelszó-mező végén egy szem ikonnal: kattintásra láthatóvá / rejtetté teszi
 * a beírt jelszót. Saját `relative` burkolót ad, így bármilyen Input-helyre
 * becsúsztatható (a bal oldali ikont a hívó a className-mel kezelheti).
 */
export function PasswordInput({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        tabIndex={-1}
        aria-label={show ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        title={show ? "Jelszó elrejtése" : "Jelszó megjelenítése"}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
