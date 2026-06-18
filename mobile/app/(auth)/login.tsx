import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setLoading(false);
    if (error) {
      setError("Hibás email vagy jelszó.");
      return;
    }
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 32 }}>
          creatorz
        </Text>
        <Text style={{ color: colors.textOnDark, fontSize: 24, fontWeight: "800", marginTop: 24 }}>
          Üdv újra!
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          Lépj be a fiókodba.
        </Text>

        <View style={{ marginTop: 28, gap: 12 }}>
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
            placeholder="Jelszó"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={inputStyle}
          />
          {error ? (
            <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text>
          ) : null}

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
              <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>
                Bejelentkezés
              </Text>
            )}
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 6 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)" }}>Még nincs fiókod?</Text>
          <Link href="/(auth)/register" style={{ color: colors.accent, fontWeight: "700" }}>
            Regisztrálj
          </Link>
        </View>
      </View>
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
