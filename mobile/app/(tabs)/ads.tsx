import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchAds, type AdListItem } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function huDate(iso: string) {
  return new Date(iso).toLocaleDateString("hu-HU", { year: "numeric", month: "2-digit", day: "2-digit" });
}

export default function AdsScreen() {
  const router = useRouter();
  const [items, setItems] = useState<AdListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (reset: boolean) => {
    try {
      const res = await fetchAds(reset ? 0 : offset);
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setOffset(res.nextOffset);
    } catch {
      // némán
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offset]);

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted }}>
        <ActivityIndicator color={colors.accentDark} size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load(true);
            }}
            tintColor={colors.accentDark}
          />
        }
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (hasMore && !loading) load(false);
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: colors.muted, marginTop: 50 }}>
            Jelenleg nincs aktív hirdetés.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/ads/${item.slug ?? item.id}`)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              overflow: "hidden",
              borderWidth: item.isFeatured ? 1.5 : 1,
              borderColor: item.isFeatured ? colors.accent : colors.border,
            }}
          >
            {item.coverUrl ? (
              <Image source={{ uri: item.coverUrl }} style={{ width: "100%", height: 120 }} />
            ) : null}
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: colors.accentDark, fontWeight: "700", fontSize: 12 }} numberOfLines={1}>
                  {item.brandName}
                </Text>
                {item.isFeatured ? <Ionicons name="sparkles" size={12} color={colors.accentDark} /> : null}
              </View>
              <Text style={{ fontWeight: "800", fontSize: 17, marginTop: 2 }} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {item.categoryLabels.slice(0, 3).map((c) => (
                  <View key={c} style={{ backgroundColor: "#f0f2e8", borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#3f6212" }}>{c}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <Text style={{ fontSize: 12, color: colors.text }}>
                  <Ionicons name="wallet-outline" size={12} /> {item.budgetLabel}
                </Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>
                  <Ionicons name="calendar-outline" size={12} /> {huDate(item.deadline)}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
