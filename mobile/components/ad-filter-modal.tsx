import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, CONTENT_TYPES, COLLABORATION_TYPES } from "@/lib/constants";
import type { AdFilters } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export function AdFilterModal({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: AdFilters;
  onClose: () => void;
  onApply: (f: AdFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<AdFilters>(initial);

  useEffect(() => {
    if (visible) setF(initial);
  }, [visible, initial]);

  const toggleCat = (v: string) =>
    setF((prev) => {
      const arr = prev.categories ?? [];
      return { ...prev, categories: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  const single = (key: "contentType" | "collaborationType", v: string) =>
    setF((prev) => ({ ...prev, [key]: prev[key] === v ? "" : v }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
        <View style={{ paddingTop: insets.top + 6, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>Szűrők</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 24 }}>
          <Section title="Kategóriák">
            <Wrap>
              {CATEGORIES.map((c) => (
                <Chip key={c.value} label={`${c.emoji} ${c.label}`} active={(f.categories ?? []).includes(c.value)} onPress={() => toggleCat(c.value)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Tartalom típusa">
            <Wrap>
              {CONTENT_TYPES.map((c) => (
                <Chip key={c.value} label={c.label} active={f.contentType === c.value} onPress={() => single("contentType", c.value)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Együttműködés típusa">
            <Wrap>
              {COLLABORATION_TYPES.map((c) => (
                <Chip key={c.value} label={c.label} active={f.collaborationType === c.value} onPress={() => single("collaborationType", c.value)} />
              ))}
            </Wrap>
          </Section>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 10, padding: 14, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable
            onPress={() => {
              const cleared: AdFilters = {};
              setF(cleared);
              onApply(cleared);
              onClose();
            }}
            style={{ paddingHorizontal: 18, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 6 }}
          >
            <Ionicons name="close" size={16} color={colors.text} />
            <Text style={{ fontWeight: "700" }}>Törlés</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              onApply(f);
              onClose();
            }}
            style={{ flex: 1, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          >
            <Ionicons name="filter" size={18} color={colors.accent} />
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Szűrés</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "800", fontSize: 14 }}>{title}</Text>
      {children}
    </View>
  );
}
function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: active ? colors.accent : colors.surface, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}
    >
      <Text style={{ fontSize: 13, fontWeight: active ? "800" : "600", color: active ? "#000" : colors.text }}>{label}</Text>
    </Pressable>
  );
}
