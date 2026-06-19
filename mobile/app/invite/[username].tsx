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
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchBrandAds, inviteCreator } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function InviteScreen() {
  const { username, name } = useLocalSearchParams<{ username: string; name?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [ads, setAds] = useState<{ id: string; title: string }[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetchBrandAds()
      .then((r) => {
        setAds(r.items);
        if (r.items.length === 1) setSelected(r.items[0]!.id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function onSend() {
    if (!selected) {
      setError("Válassz egy hirdetést.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await inviteCreator(String(username), selected, message.trim());
      if (!res.success) {
        setError(res.error ?? "Nem sikerült a meghívás.");
        return;
      }
      setDone(true);
    } catch {
      setError("Nem sikerült a meghívás.");
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
          Meghívás — {name ?? username}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : done ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.accentDark} />
          <Text style={{ fontWeight: "800", fontSize: 18 }}>Meghívás elküldve!</Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 8, backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Vissza</Text>
          </Pressable>
        </View>
      ) : ads.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <Text style={{ color: colors.muted, textAlign: "center" }}>
            Nincs aktív hirdetésed. Adj fel egyet a weboldalon, hogy meghívhass creatorokat.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <Text style={{ fontWeight: "700" }}>Melyik hirdetésre?</Text>
          {ads.map((ad) => {
            const active = selected === ad.id;
            return (
              <Pressable
                key={ad.id}
                onPress={() => setSelected(ad.id)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}
              >
                <Text style={{ flex: 1, fontWeight: active ? "700" : "500" }}>{ad.title}</Text>
                {active ? <Ionicons name="checkmark-circle" size={20} color={colors.accentDark} /> : null}
              </Pressable>
            );
          })}

          <Text style={{ fontWeight: "700", marginTop: 6 }}>Üzenet (opcionális)</Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Írd le pár szóban, miért pont őt hívod meg…"
            placeholderTextColor={colors.muted}
            multiline
            style={{ minHeight: 90, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 15, textAlignVertical: "top" }}
          />
          {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
          <Pressable
            onPress={onSend}
            disabled={sending || !selected}
            style={{ backgroundColor: selected ? colors.accent : colors.border, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
          >
            {sending ? <ActivityIndicator color="#000" /> : <Ionicons name="megaphone" size={18} color="#000" />}
            <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Meghívás küldése</Text>
          </Pressable>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}
