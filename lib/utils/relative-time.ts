/** Magyar relatív idő: "most", "3 perce", "2 órája", "tegnap", "5 napja", egyébként dátum. */
export function relativeTime(input: Date | string | null | undefined): string {
  if (!input) return "";
  const date = new Date(input);
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "most";
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "most";
  if (min < 60) return `${min} perce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.floor(h / 24);
  if (d === 1) return "tegnap";
  if (d < 7) return `${d} napja`;
  if (d < 30) return `${Math.floor(d / 7)} hete`;
  return new Intl.DateTimeFormat("hu-HU", { dateStyle: "medium" }).format(date);
}
