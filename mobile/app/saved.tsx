import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchSaved, type SavedCreator } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function fmt(n: number | null) {
  return n == null ? "—" : n.toLocaleString("hu-HU");
}

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SavedCreator[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchSaved();
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
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Mentett tartalomgyártók</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.username}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32 }}>
              <Ionicons name="heart-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
                Még nincs mentett tartalomgyártód. A profiljukon a „Mentés" gombbal adhatsz hozzá.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/creators/${item.username}`)}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.border }}
            >
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={{ width: 52, height: 52, borderRadius: 26 }} />
              ) : (
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: "#e9ecdf", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontWeight: "800", color: colors.accentDark }}>{item.displayName.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Text style={{ fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{item.displayName}</Text>
                  {item.verified ? <Ionicons name="checkmark-circle" size={14} color={colors.accentDark} /> : null}
                </View>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                  {[item.city, item.tiktokFollowers ? `${fmt(item.tiktokFollowers)} TikTok` : null].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
