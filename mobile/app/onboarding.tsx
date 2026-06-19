import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMe, saveProfile } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean };

const CREATOR_FIELDS: Field[] = [
  { key: "displayName", label: "Megjelenített neved" },
  { key: "city", label: "Város", placeholder: "pl. Budapest" },
  { key: "bio", label: "Rövid bemutatkozás", multiline: true, placeholder: "Kinek és mit készítesz?" },
];
const BRAND_FIELDS: Field[] = [
  { key: "companyName", label: "Cég / márka neve" },
  { key: "industry", label: "Iparág", placeholder: "pl. Szépségápolás" },
  { key: "description", label: "Rövid bemutatkozás", multiline: true },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((res) => {
        if (!alive) return;
        const f = res.role === "brand" ? BRAND_FIELDS : CREATOR_FIELDS;
        setFields(f);
        const v: Record<string, string> = {};
        for (const field of f) {
          const cur = (res.profile?.[field.key] as string) ?? "";
          // Az alapból generált (email-alapú) nevet ne töltsük elő.
          v[field.key] = field.key === "displayName" || field.key === "companyName"
            ? (cur.includes("@") ? "" : cur)
            : cur;
        }
        setValues(v);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    setSaving(true);
    try {
      await saveProfile(values);
    } catch {
      // best-effort — akkor is továbbengedjük
    } finally {
      setSaving(false);
      router.replace("/(tabs)");
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 16, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 24 }}>Üdv a Creatorzon! 🎬</Text>
        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
          Pár adat, és kész is a profilod. Bármikor szerkesztheted később.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }}>
        {fields.map((f) => (
          <View key={f.key} style={{ gap: 6 }}>
            <Text style={{ fontWeight: "700" }}>{f.label}</Text>
            <TextInput
              value={values[f.key] ?? ""}
              onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
              placeholder={f.placeholder}
              placeholderTextColor={colors.muted}
              multiline={f.multiline}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 12,
                fontSize: 15,
                minHeight: f.multiline ? 90 : undefined,
                textAlignVertical: f.multiline ? "top" : "center",
              }}
            />
          </View>
        ))}

        <Pressable
          onPress={onSave}
          disabled={saving}
          style={{ backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", marginTop: 4 }}
        >
          {saving ? <ActivityIndicator color="#000" /> : <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Mehet!</Text>}
        </Pressable>
        <Pressable onPress={() => router.replace("/(tabs)")} style={{ alignItems: "center", paddingVertical: 8 }}>
          <Text style={{ color: colors.muted, fontWeight: "600" }}>Most kihagyom</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
