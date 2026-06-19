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
  // Folyamatos háttér-animáció (lebegő foltok + logó-pulzálás).
  const blob1 = useRef(new Animated.Value(0)).current;
  const blob2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  // A play-kör ("o") belépő beperdülése.
  const ringSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
        Animated.timing(ringSpin, { toValue: 1, duration: 750, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(formY, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    const loop = (val: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      );
    const a1 = loop(blob1, 7000);
    const a2 = loop(blob2, 9000);
    const a3 = loop(pulse, 2200);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [logoOpacity, logoScale, formY, formOpacity, blob1, blob2, pulse, ringSpin]);

  const blob1T = {
    transform: [
      { translateY: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, 50] }) },
      { translateX: blob1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
      { scale: blob1.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] }) },
    ],
  };
  const blob2T = {
    transform: [
      { translateY: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, -40] }) },
      { translateX: blob2.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) },
      { scale: blob2.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.85] }) },
    ],
  };
  // A play-kör: belépéskor beperdül (-150°→0°), majd folyamatosan lüktet.
  const ringAnim = {
    transform: [
      { rotate: ringSpin.interpolate({ inputRange: [0, 1], outputRange: ["-150deg", "0deg"] }) },
      { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.09] }) },
    ],
  };
  // A talajárnyék finoman tágul-szűkül a lüktetéssel.
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
      {/* Animált accent fény-foltok a háttérben */}
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -120, right: -100, width: 320, height: 320, borderRadius: 160, backgroundColor: colors.accent, opacity: 0.16 }, blob1T]} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", bottom: -140, left: -120, width: 340, height: 340, borderRadius: 170, backgroundColor: colors.accent, opacity: 0.09 }, blob2T]} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", top: "32%", left: "30%", width: 200, height: 200, borderRadius: 100, backgroundColor: "#22d3ee", opacity: 0.06 }, blob2T]} />

      <View style={{ flex: 1, justifyContent: "center", padding: 28 }}>
        {/* Animált logó — a "creatorz" wordmark, ahol az "o" egy lime play-kör
            (a megadott brand logó alapján). */}
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }], alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={wordmarkStyle}>creat</Text>
            <Animated.View
              style={[
                {
                  width: 38,
                  height: 38,
                  borderRadius: 19,
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
          {/* Lágy talajárnyék a play-kör alatt (mint a logón). */}
          <Animated.View
            pointerEvents="none"
            style={[
              { width: 70, height: 10, borderRadius: 35, backgroundColor: colors.accent, marginTop: 6 },
              shadowAnim,
            ]}
          />
          <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 12, fontSize: 14 }}>
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

const wordmarkStyle = {
  color: "#fff",
  fontWeight: "900",
  fontSize: 40,
  letterSpacing: -1.5,
} as const;

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
