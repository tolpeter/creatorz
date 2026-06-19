import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { colors, radius } from "@/lib/theme";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Induló animáció: logó beúszik + skálázódik, a form alulról felúszik.
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const formY = useRef(new Animated.Value(28)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [logoOpacity, logoScale, formY, formOpacity]);

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
      {/* Dekoratív accent fény */}
      <View pointerEvents="none" style={{ position: "absolute", top: -120, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: colors.accent, opacity: 0.16 }} />
      <View pointerEvents="none" style={{ position: "absolute", bottom: -140, left: -120, width: 320, height: 320, borderRadius: 160, backgroundColor: colors.accent, opacity: 0.08 }} />

      <View style={{ flex: 1, justifyContent: "center", padding: 28 }}>
        {/* Animált logó + név */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: "flex-start" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="play" size={24} color="#000" style={{ marginLeft: 3 }} />
            </View>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 36, letterSpacing: -1 }}>
              creat<Text style={{ color: colors.accent }}>o</Text>rz
            </Text>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 10, fontSize: 14 }}>
            A magyar UGC tartalomgyártó közösség
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formY }], marginTop: 40 }}>
          <Text style={{ color: colors.textOnDark, fontSize: 26, fontWeight: "800" }}>Üdv újra!</Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Lépj be a fiókodba.</Text>

          <View style={{ marginTop: 26, gap: 12 }}>
            <TextInput
              placeholder="Email cím"
              placeholderTextColor="rgba(255,255,255,0.4)"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={inputStyle}
            />
            <View style={{ position: "relative", justifyContent: "center" }}>
              <TextInput
                placeholder="Jelszó"
                placeholderTextColor="rgba(255,255,255,0.4)"
                secureTextEntry={!show}
                value={password}
                onChangeText={setPassword}
                style={[inputStyle, { paddingRight: 48 }]}
              />
              <Pressable onPress={() => setShow((v) => !v)} hitSlop={10} style={{ position: "absolute", right: 14 }}>
                <Ionicons name={show ? "eye-off" : "eye"} size={20} color="rgba(255,255,255,0.5)" />
              </Pressable>
            </View>
            {error ? <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text> : null}

            <Pressable
              onPress={onSubmit}
              disabled={loading}
              style={{ backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: 15, alignItems: "center", marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Bejelentkezés</Text>
              )}
            </Pressable>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24, gap: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)" }}>Még nincs fiókod?</Text>
            <Link href="/(auth)/register" style={{ color: colors.accent, fontWeight: "700" }}>
              Regisztrálj
            </Link>
          </View>
        </Animated.View>
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
