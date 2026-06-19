import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/auth";
import { fetchMyStats, type MyStats } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function ago(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return "ma";
  if (d === 1) return "tegnap";
  return `${d} napja`;
}

export default function ProfileScreen() {
  const { session, role, signOut } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<MyStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchMyStats()
        .then(setStats)
        .catch(() => {});
    }, []),
  );

  async function onSignOut() {
    await signOut();
    router.replace("/(auth)/login");
  }

  const percent = stats?.completion.percent ?? 0;
  const nextMissing = stats?.completion.items.find((i) => !i.done);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.surfaceMuted }} contentContainerStyle={{ padding: 20, paddingBottom: 32 }}>
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
          <Ionicons name="person" size={36} color={colors.accent} />
        </View>
        <Text style={{ marginTop: 12, fontWeight: "800", fontSize: 16 }}>{session?.user.email ?? "Felhasználó"}</Text>
      </View>

      {/* Profil-erő (kitöltöttség) */}
      {stats ? (
        <View style={{ marginTop: 20, backgroundColor: colors.bg, borderRadius: radius.lg, padding: 16 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "600" }}>Profil erő</Text>
            <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 22 }}>{percent}%</Text>
          </View>
          <View style={{ height: 8, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 4, marginTop: 8, overflow: "hidden" }}>
            <View style={{ width: `${percent}%`, height: "100%", backgroundColor: colors.accent }} />
          </View>
          {nextMissing ? (
            <Pressable onPress={() => router.push("/profile/edit")} style={{ marginTop: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
                Következő lépés: <Text style={{ color: colors.accent, fontWeight: "700" }}>{nextMissing.label}</Text> →
              </Text>
            </Pressable>
          ) : (
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 10 }}>🎉 A profilod teljes!</Text>
          )}
        </View>
      ) : null}

      {/* Megtekintések (creator) */}
      {stats?.role === "creator" && stats.views ? (
        <View style={{ marginTop: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#f0f4e5", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="eye" size={22} color={colors.accentDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "800", fontSize: 15 }}>
              {stats.views.weekly} profil-megtekintés a héten
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {stats.views.weeklyViewers} különböző látogatótól
            </Text>
          </View>
        </View>
      ) : null}

      {/* Kik nézték meg (csak ha az admin engedélyezte) */}
      {stats?.canSeeViewers ? (
        <View style={{ marginTop: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: colors.accent, gap: 10 }}>
          <Text style={{ fontWeight: "800" }}>⭐ Kik nézték meg</Text>
          {(stats.viewers ?? []).length === 0 ? (
            <Text style={{ color: colors.muted, fontSize: 13 }}>Még senki azonosítható.</Text>
          ) : (
            (stats.viewers ?? []).slice(0, 8).map((vw, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {vw.avatarUrl ? (
                  <Image source={{ uri: vw.avatarUrl }} style={{ width: 34, height: 34, borderRadius: 17 }} />
                ) : (
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#e9ecdf", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontWeight: "800", color: colors.accentDark }}>{vw.name.charAt(0).toUpperCase()}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "700", fontSize: 14 }} numberOfLines={1}>{vw.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {vw.type === "brand" ? "Márka" : vw.type === "creator" ? "Tartalomgyártó" : "Felhasználó"} · {ago(vw.lastAt)}{vw.times > 1 ? ` · ${vw.times}×` : ""}
                  </Text>
                </View>
              </View>
            ))
          )}
          {stats.anonymous ? (
            <Text style={{ color: colors.muted, fontSize: 12 }}>+ {stats.anonymous} be nem jelentkezett látogató</Text>
          ) : null}
        </View>
      ) : null}

      <View style={{ marginTop: 18, gap: 1, borderRadius: radius.lg, overflow: "hidden" }}>
        <Row icon="create-outline" label="Profil szerkesztése" onPress={() => router.push("/profile/edit")} />
        {role === "creator" ? (
          <Row icon="document-text-outline" label="Pályázataim" onPress={() => router.push("/my-applications")} />
        ) : null}
        {role === "brand" ? (
          <Row icon="heart-outline" label="Mentett tartalomgyártók" onPress={() => router.push("/saved")} />
        ) : null}
        <Row icon="help-circle-outline" label="Súgó (hamarosan)" />
      </View>

      <Pressable
        onPress={onSignOut}
        style={{ marginTop: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: "700" }}>Kijelentkezés</Text>
      </Pressable>
    </ScrollView>
  );
}

function Row({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14 }}>
      <Ionicons name={icon} size={20} color={colors.accentDark} />
      <Text style={{ fontSize: 15, flex: 1 }}>{label}</Text>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
    </Pressable>
  );
}
