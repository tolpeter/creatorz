import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchMyApplications, type MyApplication } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: "Függőben", bg: "#fef3c7", fg: "#92400e" },
  accepted: { label: "Elfogadva", bg: "#dcfce7", fg: "#166534" },
  rejected: { label: "Elutasítva", bg: "#fee2e2", fg: "#991b1b" },
  withdrawn: { label: "Visszavonva", bg: "#f3f4f6", fg: "#6b7280" },
};

function huDate(iso: string) {
  return new Date(iso).toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function MyApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchMyApplications();
      setItems(res.items);
    } catch {
      // némán
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Pályázataim</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32 }}>
              <Ionicons name="document-text-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
                Még nem pályáztál. A Kampányok fülön találsz briefeket.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const s = STATUS[item.status] ?? STATUS.pending;
            return (
              <Pressable
                onPress={() => router.push(`/ads/${item.adSlug ?? item.adId}`)}
                style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.border }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
                  <Text style={{ fontWeight: "700", flex: 1 }} numberOfLines={2}>{item.adTitle}</Text>
                  <View style={{ backgroundColor: s.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start" }}>
                    <Text style={{ color: s.fg, fontWeight: "700", fontSize: 12 }}>{s.label}</Text>
                  </View>
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{huDate(item.createdAt)}</Text>
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}
