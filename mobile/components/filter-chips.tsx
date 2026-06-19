import { Pressable, ScrollView, Text } from "react-native";
import { colors, radius } from "@/lib/theme";

export type ChipOption = { value: string; label: string; emoji?: string };

/** Vízszintesen görgethető, egyválasztós chip-sor (szűrőkhöz). */
export function FilterChips({
  options,
  value,
  onChange,
  allLabel = "Mind",
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
  allLabel?: string;
}) {
  const all: ChipOption[] = [{ value: "", label: allLabel }, ...options];
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10 }}
    >
      {all.map((opt) => {
        const active = value === opt.value;
        return (
          <Pressable
            key={opt.value || "all"}
            onPress={() => onChange(opt.value)}
            style={{
              borderRadius: radius.pill,
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: active ? colors.accent : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.accent : colors.border,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: active ? "800" : "600", color: active ? "#000" : colors.text }}>
              {opt.emoji ? `${opt.emoji} ` : ""}
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
