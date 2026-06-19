import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { fetchMe, saveProfile, uploadImage } from "@/lib/api";
import { pickImage } from "@/lib/image";
import { CATEGORIES, LANGUAGES, GENDERS, COUNTIES } from "@/lib/constants";
import { colors, radius } from "@/lib/theme";

type V = Record<string, unknown>;

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState<"creator" | "brand" | "other">("other");
  const [v, setV] = useState<V>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((res) => {
        if (!alive) return;
        setRole(res.role === "brand" ? "brand" : res.role === "creator" ? "creator" : "other");
        const p = (res.profile ?? {}) as V;
        const eq = (p.equipment ?? {}) as Record<string, string>;
        setV({
          ...p,
          categories: (p.categories as string[]) ?? [],
          languages: (p.languages as string[]) ?? [],
          eqPhone: eq.phone ?? "",
          eqCamera: eq.camera ?? "",
          eqMicrophone: eq.microphone ?? "",
          eqEditing: eq.editing ?? "",
        });
      })
      .catch(() => setError("Nem sikerült betölteni a profilt."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const set = (key: string, val: unknown) => setV((p) => ({ ...p, [key]: val }));
  const str = (key: string) => (v[key] as string) ?? "";
  const arr = (key: string) => (v[key] as string[]) ?? [];
  const toggle = (key: string, val: string) =>
    set(key, arr(key).includes(val) ? arr(key).filter((x) => x !== val) : [...arr(key), val]);

  async function onPickImage(field: "avatarUrl" | "logoUrl", bucket: "avatars" | "logos") {
    const img = await pickImage();
    if (!img) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadImage(bucket, img.base64, img.ext);
      if (res.url) set(field, res.url);
      else setError(res.error ?? "A kép feltöltése nem sikerült.");
    } catch {
      setError("A kép feltöltése nem sikerült.");
    } finally {
      setUploading(false);
    }
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    const payload: V =
      role === "brand"
        ? {
            companyName: str("companyName"),
            logoUrl: str("logoUrl"),
            contactName: str("contactName"),
            contactPhone: str("contactPhone"),
            taxNumber: str("taxNumber"),
            address: str("address"),
            industry: str("industry"),
            websiteUrl: str("websiteUrl"),
            description: str("description"),
          }
        : {
            displayName: str("displayName"),
            avatarUrl: str("avatarUrl"),
            bio: str("bio"),
            city: str("city"),
            county: str("county"),
            birthDate: str("birthDate"),
            gender: str("gender"),
            categories: arr("categories"),
            languages: arr("languages"),
            websiteUrl: str("websiteUrl"),
            instagramUrl: str("instagramUrl"),
            instagramFollowers: str("instagramFollowers"),
            tiktokUrl: str("tiktokUrl"),
            tiktokFollowers: str("tiktokFollowers"),
            facebookUrl: str("facebookUrl"),
            facebookFollowers: str("facebookFollowers"),
            youtubeUrl: str("youtubeUrl"),
            youtubeSubscribers: str("youtubeSubscribers"),
            equipment: {
              phone: str("eqPhone"),
              camera: str("eqCamera"),
              microphone: str("eqMicrophone"),
              editing: str("eqEditing"),
            },
          };
    try {
      const res = await saveProfile(payload);
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

  const imageUrl = role === "brand" ? str("logoUrl") : str("avatarUrl");

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
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
          {/* Profilkép / logó */}
          <View style={{ alignItems: "center", gap: 10 }}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: 96, height: 96, borderRadius: 48 }} />
            ) : (
              <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: "#e9ecdf", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={role === "brand" ? "business" : "person"} size={36} color={colors.accentDark} />
              </View>
            )}
            <Pressable
              onPress={() => onPickImage(role === "brand" ? "logoUrl" : "avatarUrl", role === "brand" ? "logos" : "avatars")}
              disabled={uploading}
              style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 8 }}
            >
              {uploading ? <ActivityIndicator size="small" color={colors.accentDark} /> : <Ionicons name="camera" size={16} color={colors.accentDark} />}
              <Text style={{ fontWeight: "700" }}>{role === "brand" ? "Logó feltöltése" : "Profilkép feltöltése"}</Text>
            </Pressable>
          </View>

          {error ? <Text style={{ color: colors.danger, textAlign: "center" }}>{error}</Text> : null}

          {role === "brand" ? (
            <>
              <Field label="Cégnév" value={str("companyName")} onChange={(t) => set("companyName", t)} />
              <Field label="Kapcsolattartó" value={str("contactName")} onChange={(t) => set("contactName", t)} />
              <Field label="Telefonszám" value={str("contactPhone")} onChange={(t) => set("contactPhone", t)} keyboard="phone-pad" />
              <Field label="Iparág" value={str("industry")} onChange={(t) => set("industry", t)} />
              <Field label="Adószám" value={str("taxNumber")} onChange={(t) => set("taxNumber", t)} />
              <Field label="Cím" value={str("address")} onChange={(t) => set("address", t)} />
              <Field label="Weboldal" value={str("websiteUrl")} onChange={(t) => set("websiteUrl", t)} url />
              <Field label="Bemutatkozás" value={str("description")} onChange={(t) => set("description", t)} multiline />
            </>
          ) : (
            <>
              <Field label="Megjelenített név" value={str("displayName")} onChange={(t) => set("displayName", t)} />
              <Field label="Bemutatkozás" value={str("bio")} onChange={(t) => set("bio", t)} multiline />
              <Field label="Város" value={str("city")} onChange={(t) => set("city", t)} />

              <Block label="Megye">
                <Wrap>
                  {COUNTIES.map((c) => (
                    <Chip key={c} label={c} active={str("county") === c} onPress={() => set("county", str("county") === c ? "" : c)} />
                  ))}
                </Wrap>
              </Block>

              <Field label="Születési dátum (ÉÉÉÉ-HH-NN)" value={str("birthDate")} onChange={(t) => set("birthDate", t)} placeholder="2000-01-31" />

              <Block label="Nem">
                <Wrap>
                  {GENDERS.map((g) => (
                    <Chip key={g.value} label={g.label} active={str("gender") === g.value} onPress={() => set("gender", str("gender") === g.value ? "" : g.value)} />
                  ))}
                </Wrap>
              </Block>

              <Block label="Kategóriák">
                <Wrap>
                  {CATEGORIES.map((c) => (
                    <Chip key={c.value} label={`${c.emoji} ${c.label}`} active={arr("categories").includes(c.value)} onPress={() => toggle("categories", c.value)} />
                  ))}
                </Wrap>
              </Block>

              <Block label="Nyelvek">
                <Wrap>
                  {LANGUAGES.map((l) => (
                    <Chip key={l.value} label={l.label} active={arr("languages").includes(l.value)} onPress={() => toggle("languages", l.value)} />
                  ))}
                </Wrap>
              </Block>

              <Field label="Weboldal" value={str("websiteUrl")} onChange={(t) => set("websiteUrl", t)} url />

              <Block label="Közösségi profilok">
                <Social label="TikTok" url={str("tiktokUrl")} count={str("tiktokFollowers")} onUrl={(t) => set("tiktokUrl", t)} onCount={(t) => set("tiktokFollowers", t)} />
                <Social label="Instagram" url={str("instagramUrl")} count={str("instagramFollowers")} onUrl={(t) => set("instagramUrl", t)} onCount={(t) => set("instagramFollowers", t)} />
                <Social label="YouTube" url={str("youtubeUrl")} count={str("youtubeSubscribers")} onUrl={(t) => set("youtubeUrl", t)} onCount={(t) => set("youtubeSubscribers", t)} />
                <Social label="Facebook" url={str("facebookUrl")} count={str("facebookFollowers")} onUrl={(t) => set("facebookUrl", t)} onCount={(t) => set("facebookFollowers", t)} />
              </Block>

              <Block label="Eszközök (opcionális)">
                <Field label="Telefon" value={str("eqPhone")} onChange={(t) => set("eqPhone", t)} compact />
                <Field label="Kamera" value={str("eqCamera")} onChange={(t) => set("eqCamera", t)} compact />
                <Field label="Mikrofon" value={str("eqMicrophone")} onChange={(t) => set("eqMicrophone", t)} compact />
                <Field label="Vágás" value={str("eqEditing")} onChange={(t) => set("eqEditing", t)} compact />
              </Block>
            </>
          )}

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

function Field({
  label,
  value,
  onChange,
  multiline,
  url,
  compact,
  keyboard,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (t: string) => void;
  multiline?: boolean;
  url?: boolean;
  compact?: boolean;
  keyboard?: "phone-pad";
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: compact ? "600" : "700", fontSize: compact ? 13 : 14, color: compact ? colors.muted : colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        multiline={multiline}
        autoCapitalize={url ? "none" : "sentences"}
        keyboardType={keyboard ?? "default"}
        style={{ backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15, minHeight: multiline ? 90 : undefined, textAlignVertical: multiline ? "top" : "center" }}
      />
    </View>
  );
}

function Social({
  label,
  url,
  count,
  onUrl,
  onCount,
}: {
  label: string;
  url: string;
  count: string;
  onUrl: (t: string) => void;
  onCount: (t: string) => void;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: "600", fontSize: 13, color: colors.muted }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={url} onChangeText={onUrl} placeholder="@név vagy URL" placeholderTextColor={colors.muted} autoCapitalize="none" style={{ flex: 2, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 11, fontSize: 14 }} />
        <TextInput value={count} onChangeText={(t) => onCount(t.replace(/\D/g, ""))} placeholder="követő" placeholderTextColor={colors.muted} keyboardType="numeric" style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 11, fontSize: 14 }} />
      </View>
    </View>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontWeight: "800", fontSize: 14 }}>{label}</Text>
      {children}
    </View>
  );
}
function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}
function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7, backgroundColor: active ? colors.accent : colors.surface, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}>
      <Text style={{ fontSize: 13, fontWeight: active ? "800" : "600", color: active ? "#000" : colors.text }}>{label}</Text>
    </Pressable>
  );
}
