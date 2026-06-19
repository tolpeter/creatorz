import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import { colors, radius } from "@/lib/theme";

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();

  async function onSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted, padding: 20 }}>
      <View style={{ alignItems: "center", marginTop: 24 }}>
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="person" size={36} color={colors.accent} />
        </View>
        <Text style={{ marginTop: 12, fontWeight: "800", fontSize: 16 }}>
          {session?.user.email ?? "Felhasználó"}
        </Text>
      </View>

      <View style={{ marginTop: 32, gap: 1, borderRadius: radius.lg, overflow: "hidden" }}>
        <Row icon="create-outline" label="Profil szerkesztése" onPress={() => router.push("/profile/edit")} />
        <Row icon="help-circle-outline" label="Súgó (hamarosan)" />
      </View>

      <Pressable
        onPress={onSignOut}
        style={{
          marginTop: 24,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.md,
          paddingVertical: 14,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: "700" }}>Kijelentkezés</Text>
      </Pressable>
    </View>
  );
}

function Row({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}
    >
      <Ionicons name={icon} size={20} color={colors.accentDark} />
      <Text style={{ fontSize: 15, flex: 1 }}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}
