import { Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  HAIR_COLOR_LABELS,
  EYE_COLOR_LABELS,
  MODEL_TYPE_LABELS,
} from "@/lib/constants";

export type ModelAttributes = {
  heightCm?: number;
  weightKg?: number;
  hairColor?: string;
  eyeColor?: string;
  bodyArt?: string;
  modelTypes?: string[];
};

/** Publikus „Modell paraméterek" blokk (csak modell-típusú alkotóknál). */
export function ModelAttributesBlock({ attrs }: { attrs: ModelAttributes }) {
  const rows: { label: string; value: string }[] = [];
  if (attrs.heightCm) rows.push({ label: "Magasság", value: `${attrs.heightCm} cm` });
  if (attrs.weightKg) rows.push({ label: "Súly", value: `${attrs.weightKg} kg` });
  if (attrs.hairColor)
    rows.push({ label: "Hajszín", value: HAIR_COLOR_LABELS[attrs.hairColor] ?? attrs.hairColor });
  if (attrs.eyeColor)
    rows.push({ label: "Szemszín", value: EYE_COLOR_LABELS[attrs.eyeColor] ?? attrs.eyeColor });

  const hasTypes = (attrs.modelTypes?.length ?? 0) > 0;
  const hasContent = rows.length > 0 || hasTypes || !!attrs.bodyArt;
  if (!hasContent) return null;

  return (
    <section className="rounded-[1.75rem] border border-black/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-[#3f6212]">
          <Ruler className="h-5 w-5" />
        </span>
        <h2 className="text-lg font-black">Modell paraméterek</h2>
      </div>

      {rows.length > 0 && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {rows.map((r) => (
            <div key={r.label} className="rounded-xl border bg-[#f6f7f2] p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{r.label}</dt>
              <dd className="mt-0.5 text-base font-bold">{r.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {hasTypes && (
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Modell-típus
          </p>
          <div className="flex flex-wrap gap-2">
            {attrs.modelTypes!.map((t) => (
              <Badge key={t} variant="secondary">
                {MODEL_TYPE_LABELS[t] ?? t}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {attrs.bodyArt && (
        <div className="mt-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Tetoválás / piercing
          </p>
          <p className="text-sm text-foreground/90">{attrs.bodyArt}</p>
        </div>
      )}
    </section>
  );
}
