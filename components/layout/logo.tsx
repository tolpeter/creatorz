import { cn } from "@/lib/utils";

/**
 * Creatorz wordmark — az „o" egy lime play-kör (a megadott brand logó alapján).
 * variant="light": világos szöveg (sötét háttéren). variant="dark": sötét szöveg.
 */
export function Logo({
  className,
  variant = "dark",
  withTld = false,
}: {
  className?: string;
  variant?: "light" | "dark";
  withTld?: boolean;
}) {
  const textColor = variant === "light" ? "text-white" : "text-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-baseline font-bold tracking-tight leading-none",
        className
      )}
      aria-label="Creatorz"
    >
      <span className={textColor}>creat</span>
      <PlayCircle />
      <span className={textColor}>r</span>
      <span className="text-accent">z</span>
      {withTld && <span className="ml-0.5 text-accent">.hu</span>}
    </span>
  );
}

function PlayCircle() {
  // ~1em méretű play-kör, az „o" helyén
  return (
    <svg
      viewBox="0 0 100 100"
      className="mx-[0.02em] inline-block h-[0.82em] w-[0.82em] translate-y-[0.06em]"
      aria-hidden="true"
    >
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="none"
        stroke="#A3E635"
        strokeWidth="11"
      />
      <path d="M40 32 L70 50 L40 68 Z" fill="currentColor" className="text-accent" />
    </svg>
  );
}
