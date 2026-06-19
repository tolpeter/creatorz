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
  const [focus, setFocus] = useState<"email" | "password" | null>(null);

  // Belépő animáció: logó beúszik + a kör beperdül, a kártya alulról felúszik.
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const ringSpin = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(32)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  // Folyamatos: háttér-glow lélegzése + a play-kör lüktetése.
  const breathe = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(ringSpin, { toValue: 1, duration: 950, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardY, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const a1 = loop(breathe, 5200);
    const a2 = loop(pulse, 2400);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, [logoOpacity, logoScale, ringSpin, cardY, cardOpacity, breathe, pulse]);

  // A nagy háttér-glow lágyan lélegzik.
  const glowTop = {
    opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.24] }),
    transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }],
  };
  const glowBottom = {
    opacity: breathe.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.05] }),
    transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.9] }) }],
  };
  // A play-kör: belépéskor pontból teljes 360°-ot perdülve nő, majd lüktet.
  const ringAnim = {
    transform: [
      { rotate: ringSpin.interpolate({ inputRange: [0, 1], outputRange: ["-360deg", "0deg"] }) },
      { scale: ringSpin.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.2, 1.18, 1] }) },
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
    ],
  };
  const shadowAnim = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.5] }),
    transform: [{ scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }],
  };

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
      {/* Lágy márka-glow a háttérben */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -200, alignSelf: "center", width: 460, height: 460, borderRadius: 230, backgroundColor: colors.accent }, glowTop]} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", bottom: -180, left: -120, width: 360, height: 360, borderRadius: 180, backgroundColor: colors.accent }, glowBottom]} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", bottom: -160, right: -140, width: 320, height: 320, borderRadius: 160, backgroundColor: "#22d3ee" }, glowBottom]} />

      <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
        {/* Animált logó — "creatorz" wordmark, az "o" egy lime play-kör */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: "center", marginBottom: 30 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={wordmarkStyle}>creat</Text>
            <Animated.View
              style={[
                {
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  borderWidth: 5,
                  borderColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginHorizontal: 1,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.7,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 0 },
                },
                ringAnim,
              ]}
            >
              <Ionicons name="play" size={16} color="#fff" style={{ marginLeft: 2 }} />
            </Animated.View>
            <Text style={wordmarkStyle}>rz</Text>
          </View>
          <Animated.View pointerEvents="none" style={[{ width: 72, height: 10, borderRadius: 36, backgroundColor: colors.accent, marginTop: 6 }, shadowAnim]} />
          <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 14, fontSize: 13, letterSpacing: 0.3 }}>
            A magyar UGC tartalomgyártó közösség
          </Text>
        </Animated.View>

        {/* Üveg kártya a formmal */}
        <Animated.View style={{ opacity: cardOpacity, transform: [{ translateY: cardY }] }}>
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.045)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.09)",
              borderRadius: 26,
              padding: 22,
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
            }}
          >
            <Text style={{ color: "#fff", fontSize: 24, fontWeight: "800", letterSpacing: -0.3 }}>Üdv újra!</Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 4, fontSize: 14 }}>
              Jelentkezz be a fiókodba.
            </Text>

            <View style={{ marginTop: 22, gap: 12 }}>
              {/* Email */}
              <View style={[fieldStyle, focus === "email" && fieldFocusStyle]}>
                <Ionicons name="mail-outline" size={18} color={focus === "email" ? colors.accent : "rgba(255,255,255,0.4)"} />
                <TextInput
                  placeholder="Email cím"
                  placeholderTextColor="rgba(255,255,255,0.38)"
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocus("email")}
                  onBlur={() => setFocus(null)}
                  style={inputTextStyle}
                />
              </View>

              {/* Jelszó */}
              <View style={[fieldStyle, focus === "password" && fieldFocusStyle]}>
                <Ionicons name="lock-closed-outline" size={18} color={focus === "password" ? colors.accent : "rgba(255,255,255,0.4)"} />
                <TextInput
                  placeholder="Jelszó"
                  placeholderTextColor="rgba(255,255,255,0.38)"
                  secureTextEntry={!show}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocus("password")}
                  onBlur={() => setFocus(null)}
                  style={inputTextStyle}
                />
                <Pressable onPress={() => setShow((v) => !v)} hitSlop={10}>
                  <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color="rgba(255,255,255,0.45)" />
                </Pressable>
              </View>

              {error ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="alert-circle" size={15} color="#fca5a5" />
                  <Text style={{ color: "#fca5a5", fontSize: 13 }}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={onSubmit}
                disabled={loading}
                style={{
                  backgroundColor: colors.accent,
                  borderRadius: radius.md,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginTop: 6,
                  opacity: loading ? 0.7 : 1,
                  shadowColor: colors.accent,
                  shadowOpacity: 0.4,
                  shadowRadius: 18,
                  shadowOffset: { width: 0, height: 6 },
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={{ color: "#000", fontWeight: "800", fontSize: 16, letterSpacing: 0.2 }}>Bejelentkezés</Text>
                )}
              </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 22, gap: 6 }}>
            <Text style={{ color: "rgba(255,255,255,0.55)" }}>Még nincs fiókod?</Text>
            <Link href="/(auth)/register" style={{ color: colors.accent, fontWeight: "700" }}>
              Regisztrálj
            </Link>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const wordmarkStyle = {
  color: "#fff",
  fontWeight: "900",
  fontSize: 42,
  letterSpacing: -1.5,
} as const;

const fieldStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.1)",
  borderRadius: radius.md,
  paddingHorizontal: 14,
  height: 54,
} as const;

const fieldFocusStyle = {
  borderColor: colors.accent,
  backgroundColor: "rgba(163,230,53,0.06)",
} as const;

const inputTextStyle = {
  flex: 1,
  color: "#fff",
  fontSize: 16,
  height: "100%",
} as const;
