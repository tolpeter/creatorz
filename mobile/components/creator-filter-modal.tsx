import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CATEGORIES, LANGUAGES, COUNTIES, GENDERS } from "@/lib/constants";
import type { CreatorFilters } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const RATINGS = [
  { value: "", label: "Bármilyen" },
  { value: "3", label: "3★+" },
  { value: "4", label: "4★+" },
  { value: "4.5", label: "4,5★+" },
];

export function CreatorFilterModal({
  visible,
  initial,
  onClose,
  onApply,
}: {
  visible: boolean;
  initial: CreatorFilters;
  onClose: () => void;
  onApply: (f: CreatorFilters) => void;
}) {
  const insets = useSafeAreaInsets();
  const [f, setF] = useState<CreatorFilters>(initial);

  useEffect(() => {
    if (visible) setF(initial);
  }, [visible, initial]);

  const toggleArr = (key: "categories" | "languages", v: string) =>
    setF((prev) => {
      const arr = prev[key] ?? [];
      return { ...prev, [key]: arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v] };
    });
  const single = (key: keyof CreatorFilters, v: string) =>
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
                <Chip key={c.value} label={`${c.emoji} ${c.label}`} active={(f.categories ?? []).includes(c.value)} onPress={() => toggleArr("categories", c.value)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Nyelvek">
            <Wrap>
              {LANGUAGES.map((l) => (
                <Chip key={l.value} label={l.label} active={(f.languages ?? []).includes(l.value)} onPress={() => toggleArr("languages", l.value)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Megye">
            <Wrap>
              {COUNTIES.map((c) => (
                <Chip key={c} label={c} active={f.county === c} onPress={() => single("county", c)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Város">
            <TextInput
              value={f.city ?? ""}
              onChangeText={(t) => setF((p) => ({ ...p, city: t }))}
              placeholder="pl. Budapest"
              placeholderTextColor={colors.muted}
              style={inputStyle}
            />
          </Section>

          <Section title="Nem">
            <Wrap>
              {GENDERS.map((g) => (
                <Chip key={g.value} label={g.label} active={f.gender === g.value} onPress={() => single("gender", g.value)} />
              ))}
            </Wrap>
          </Section>

          <Section title="Kor (év)">
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput value={f.minAge ?? ""} onChangeText={(t) => setF((p) => ({ ...p, minAge: t.replace(/\D/g, "") }))} placeholder="Min." placeholderTextColor={colors.muted} keyboardType="numeric" style={[inputStyle, { flex: 1 }]} />
              <TextInput value={f.maxAge ?? ""} onChangeText={(t) => setF((p) => ({ ...p, maxAge: t.replace(/\D/g, "") }))} placeholder="Max." placeholderTextColor={colors.muted} keyboardType="numeric" style={[inputStyle, { flex: 1 }]} />
            </View>
          </Section>

          <Section title="Min. követő">
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>Instagram</Text>
                <TextInput value={f.minIg ?? ""} onChangeText={(t) => setF((p) => ({ ...p, minIg: t.replace(/\D/g, "") }))} placeholder="pl. 10000" placeholderTextColor={colors.muted} keyboardType="numeric" style={inputStyle} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>TikTok</Text>
                <TextInput value={f.minTt ?? ""} onChangeText={(t) => setF((p) => ({ ...p, minTt: t.replace(/\D/g, "") }))} placeholder="pl. 20000" placeholderTextColor={colors.muted} keyboardType="numeric" style={inputStyle} />
              </View>
            </View>
          </Section>

          <Section title="Min. értékelés">
            <Wrap>
              {RATINGS.map((r) => (
                <Chip key={r.value || "any"} label={r.label} active={(f.minRating ?? "") === r.value} onPress={() => setF((p) => ({ ...p, minRating: r.value }))} />
              ))}
            </Wrap>
          </Section>

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontWeight: "700" }}>Csak hitelesített profil</Text>
            <Switch value={Boolean(f.verified)} onValueChange={(v) => setF((p) => ({ ...p, verified: v }))} trackColor={{ true: colors.accent }} />
          </View>
        </ScrollView>

        <View style={{ flexDirection: "row", gap: 10, padding: 14, paddingBottom: Math.max(insets.bottom, 14), backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Pressable
            onPress={() => {
              const cleared: CreatorFilters = {};
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

const inputStyle = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.md,
  paddingHorizontal: 12,
  paddingVertical: 11,
  fontSize: 15,
} as const;
