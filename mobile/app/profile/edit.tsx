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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMe, saveProfile } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

type Field = { key: string; label: string; placeholder?: string; multiline?: boolean };

const CREATOR_FIELDS: Field[] = [
  { key: "displayName", label: "Megjelenített név" },
  { key: "bio", label: "Bemutatkozás", multiline: true, placeholder: "Pár mondat magadról…" },
  { key: "city", label: "Város" },
  { key: "county", label: "Megye" },
  { key: "tiktokUrl", label: "TikTok link" },
  { key: "instagramUrl", label: "Instagram link" },
  { key: "youtubeUrl", label: "YouTube link" },
  { key: "facebookUrl", label: "Facebook link" },
];
const BRAND_FIELDS: Field[] = [
  { key: "companyName", label: "Cégnév" },
  { key: "contactName", label: "Kapcsolattartó" },
  { key: "industry", label: "Iparág" },
  { key: "websiteUrl", label: "Weboldal" },
  { key: "description", label: "Bemutatkozás", multiline: true },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState<Field[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((res) => {
        if (!alive) return;
        const f = res.role === "brand" ? BRAND_FIELDS : res.role === "creator" ? CREATOR_FIELDS : [];
        setFields(f);
        const v: Record<string, string> = {};
        for (const field of f) v[field.key] = (res.profile?.[field.key] as string) ?? "";
        setValues(v);
      })
      .catch(() => alive && setError("Nem sikerült betölteni a profilt."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await saveProfile(values);
      if (!res.success) {
        setError(res.error ?? "Mentés sikertelen.");
        return;
      }
      router.back();
    } catch {
      setError("Mentés sikertelen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Profil szerkesztése</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
          {fields.map((f) => (
            <View key={f.key} style={{ gap: 6 }}>
              <Text style={{ fontWeight: "700", color: colors.text }}>{f.label}</Text>
              <TextInput
                value={values[f.key] ?? ""}
                onChangeText={(t) => setValues((v) => ({ ...v, [f.key]: t }))}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                autoCapitalize={f.key.endsWith("Url") ? "none" : "sentences"}
                multiline={f.multiline}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: 12,
                  fontSize: 15,
                  minHeight: f.multiline ? 100 : undefined,
                  textAlignVertical: f.multiline ? "top" : "center",
                }}
              />
            </View>
          ))}
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            A profilkép, kategóriák és követőszámok szerkesztése jelenleg a weboldalon érhető el.
          </Text>
          <Pressable
            onPress={onSave}
            disabled={saving}
            style={{ backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 }}
          >
            {saving ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="checkmark" size={18} color={colors.accent} />}
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Mentés</Text>
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
