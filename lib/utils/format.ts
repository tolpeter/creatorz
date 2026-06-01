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
