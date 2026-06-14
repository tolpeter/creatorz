/** "2990" → "2 990 Ft" */
export function formatHuf(amount: number): string {
  return `${amount.toLocaleString("hu-HU").replace(/ /g, " ")} Ft`;
}

/** Nagy számok magyar tagolással (követőszám). */
export function formatNumber(n: number): string {
  return n.toLocaleString("hu-HU").replace(/ /g, " ");
}

/** "2026.05.31." magyar dátum. */
export function formatHuDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}.`;
}

/**
 * Opcionális büdzsé-tartomány megjelenítése.
 * Ha egyik érték sincs megadva: "Megegyezés szerint".
 */
export function formatBudgetRange(
  min: number | null | undefined,
  max: number | null | undefined,
  fallback = "Megegyezés szerint"
): string {
  if (min == null && max == null) return fallback;
  if (min != null && max != null) return `${formatHuf(min)} - ${formatHuf(max)}`;
  return formatHuf((max ?? min) as number);
}

/** Opcionális ár megjelenítése (pl. pályázati ár-ajánlat). */
export function formatHufOptional(
  amount: number | null | undefined,
  fallback = "Megegyezés szerint"
): string {
  if (amount == null) return fallback;
  return formatHuf(amount);
}
