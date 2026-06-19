import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { applyToAd, fetchAd, type AdDetail } from "@/lib/api";
import { useAuth } from "@/context/auth";
import { colors, radius } from "@/lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://www.creatorz.hu";

function huDate(iso: string) {
  return new Date(iso).toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AdDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { role } = useAuth();

  const [data, setData] = useState<AdDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [message, setMessage] = useState("");
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchAd(String(id))
      .then((d) => alive && setData(d))
      .catch(() => alive && setError("Nem sikerült betölteni a hirdetést."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  async function submitApply() {
    if (message.trim().length < 50) {
      setError("Az üzenet legalább 50 karakter legyen.");
      return;
    }
    setApplying(true);
    setError(null);
    try {
      await applyToAd(String(id), message.trim());
      setApplied(true);
      setShowApply(false);
    } catch {
      setError("Nem sikerült elküldeni a pályázatot (lehet, hogy hiányos a profilod).");
    } finally {
      setApplying(false);
    }
  }

  const alreadyApplied = applied || data?.alreadyApplied;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ flex: 1, color: "#fff", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
          Hirdetés
        </Text>
        {data ? (
          <Pressable
            onPress={() => Share.share({ message: `${data.title} — ${API_URL}/ads/${id}` })}
            hitSlop={10}
          >
            <Ionicons name="share-outline" size={22} color="#fff" />
          </Pressable>
        ) : null}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.muted }}>{error ?? "Nem található."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          {data.coverUrl ? <Image source={{ uri: data.coverUrl }} style={{ width: "100%", height: 160 }} /> : null}
          <View style={{ padding: 16 }}>
            <Text style={{ color: colors.accentDark, fontWeight: "700" }}>{data.brandName}</Text>
            <Text style={{ fontWeight: "900", fontSize: 22, marginTop: 4 }}>{data.title}</Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {data.targetKindLabels.map((k) => (
                <View key={k} style={{ backgroundColor: "rgba(163,230,53,0.18)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#3f6212" }}>Keresünk: {k}</Text>
                </View>
              ))}
              {data.categoryLabels.map((c) => (
                <View key={c} style={{ backgroundColor: "#f0f2e8", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#3f6212" }}>{c}</Text>
                </View>
              ))}
            </View>

            {/* Döntési pontok */}
            <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, marginTop: 16, gap: 10 }}>
              <Row icon="wallet-outline" label="Bérezés" value={data.budgetLabel} />
              <Row icon="briefcase-outline" label="Együttműködés" value={data.collabLabel} />
              <Row icon="calendar-outline" label="Határidő" value={huDate(data.deadline)} />
              <Row icon="film-outline" label="Tartalom" value={data.contentTypeLabel} />
              <Row icon="shield-checkmark-outline" label="Felhasználás" value={data.usageRightsLabel} />
              {data.location ? <Row icon="location-outline" label="Lokáció" value={data.location} /> : null}
            </View>

            <Text style={{ fontWeight: "800", fontSize: 16, marginTop: 18 }}>Leírás</Text>
            <Text style={{ color: colors.text, lineHeight: 21, marginTop: 6 }}>{data.description}</Text>

            {data.referenceLinks.length > 0 ? (
              <View style={{ marginTop: 16, gap: 8 }}>
                <Text style={{ fontWeight: "800", fontSize: 16 }}>Referenciák</Text>
                {data.referenceLinks.map((l) => (
                  <Pressable key={l} onPress={() => Linking.openURL(/^https?:\/\//i.test(l) ? l : `https://${l}`)}>
                    <Text style={{ color: colors.accentDark }} numberOfLines={1}>{l}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Pályázási rész */}
            <View style={{ marginTop: 22 }}>
              {data.invited && !alreadyApplied ? (
                <View style={{ backgroundColor: "rgba(163,230,53,0.18)", borderRadius: radius.md, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: "#3f6212", fontWeight: "600" }}>
                    ⭐ A márka kifejezetten téged hívott meg erre a hirdetésre!
                  </Text>
                </View>
              ) : null}

              {role !== "creator" ? (
                <Text style={{ color: colors.muted }}>Pályázni tartalomgyártó fiókkal lehet.</Text>
              ) : alreadyApplied ? (
                <View style={{ backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 14, alignItems: "center" }}>
                  <Text style={{ color: "#000", fontWeight: "800" }}>Erre a hirdetésre már pályáztál ✓</Text>
                </View>
              ) : showApply ? (
                <View style={{ gap: 10 }}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Mutatkozz be és írd le, miért te vagy a megfelelő (min. 50 karakter)…"
                    placeholderTextColor={colors.muted}
                    multiline
                    style={{ minHeight: 130, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 14, fontSize: 15, textAlignVertical: "top" }}
                  />
                  {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
                  <Pressable
                    onPress={submitApply}
                    disabled={applying}
                    style={{ backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  >
                    {applying ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="send" size={18} color={colors.accent} />}
                    <Text style={{ color: "#fff", fontWeight: "800" }}>Pályázat küldése</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => setShowApply(true)}
                  style={{ backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                >
                  <Ionicons name="paper-plane" size={18} color="#000" />
                  <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Pályázom</Text>
                </Pressable>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Ionicons name={icon} size={18} color={colors.accentDark} />
      <Text style={{ color: colors.muted, width: 110 }}>{label}</Text>
      <Text style={{ fontWeight: "700", flex: 1 }}>{value}</Text>
    </View>
  );
}
