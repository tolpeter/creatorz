import { useState } from "react";
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
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://www.creatorz.hu";

export default function RegisterScreen() {
  const router = useRouter();
  const [role, setRole] = useState<"creator" | "brand">("creator");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/mobile/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nem sikerült a regisztráció.");
        return;
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInErr) {
        setError("A fiók létrejött, de a belépés nem sikerült. Próbálj belépni.");
        return;
      }
      router.replace("/(tabs)");
    } catch {
      setError("Hálózati hiba. Próbáld újra.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 32 }}>creatorz</Text>
        <Text style={{ color: colors.textOnDark, fontSize: 24, fontWeight: "800", marginTop: 24 }}>
          Csatlakozz
        </Text>

        {/* Szerepkör választó */}
        <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
          {(["creator", "brand"] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={{
                flex: 1,
                borderRadius: radius.md,
                paddingVertical: 14,
                alignItems: "center",
                backgroundColor: role === r ? colors.accent : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: role === r ? colors.accent : "rgba(255,255,255,0.14)",
              }}
            >
              <Text style={{ color: role === r ? "#000" : "#fff", fontWeight: "700" }}>
                {r === "creator" ? "Tartalomgyártó" : "Márka"}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 16, gap: 12 }}>
          <TextInput
            placeholder="Email cím"
            placeholderTextColor="rgba(255,255,255,0.4)"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={inputStyle}
          />
          <TextInput
            placeholder="Jelszó (min. 8 karakter)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />
          {error ? <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={loading}
            style={{
              backgroundColor: colors.accent,
              borderRadius: radius.md,
              paddingVertical: 15,
              alignItems: "center",
              marginTop: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Fiók létrehozása</Text>
            )}
          </Pressable>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, textAlign: "center" }}>
            A regisztrációval elfogadod az Adatkezelési tájékoztatót.
          </Text>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 6 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)" }}>Van már fiókod?</Text>
          <Link href="/(auth)/login" style={{ color: colors.accent, fontWeight: "700" }}>
            Belépés
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: "#fff",
  fontSize: 16,
} as const;
