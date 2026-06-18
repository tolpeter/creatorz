import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { fetchCreators, type CreatorListItem } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function formatNumber(n: number | null) {
  if (n == null) return "—";
  return n.toLocaleString("hu-HU");
}

export default function CreatorsScreen() {
  const [items, setItems] = useState<CreatorListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q: string, reset: boolean) => {
    try {
      setError(null);
      const res = await fetchCreators(q, reset ? 0 : offset);
      setItems((prev) => (reset ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setOffset(res.nextOffset);
    } catch {
      setError("Nem sikerült betölteni a tartalomgyártókat.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [offset]);

  useEffect(() => {
    setLoading(true);
    load("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kereső debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      load(search, true);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ padding: 12, backgroundColor: colors.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: radius.pill,
            paddingHorizontal: 14,
          }}
        >
          <Ionicons name="search" size={18} color="rgba(255,255,255,0.5)" />
          <TextInput
            placeholder="Keresés név vagy város szerint…"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, color: "#fff", paddingVertical: 12 }}
          />
        </View>
      </View>

      {loading && items.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.username}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load(search, true);
              }}
              tintColor={colors.accentDark}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && !loading) load(search, false);
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: colors.muted, marginTop: 40 }}>
              {error ?? "Nincs találat."}
            </Text>
          }
          renderItem={({ item }) => <CreatorCard c={item} />}
        />
      )}
    </View>
  );
}

function CreatorCard({ c }: { c: CreatorListItem }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/creators/${c.username}`)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: 12,
        borderWidth: c.isFeatured ? 1.5 : 1,
        borderColor: c.isFeatured ? colors.accent : colors.border,
      }}
    >
      {c.avatarUrl ? (
        <Image source={{ uri: c.avatarUrl }} style={{ width: 56, height: 56, borderRadius: 28 }} />
      ) : (
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: "#e9ecdf",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontWeight: "800", color: colors.accentDark }}>
            {c.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <Text style={{ fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
            {c.displayName}
          </Text>
          {c.verified ? <Ionicons name="checkmark-circle" size={15} color={colors.accentDark} /> : null}
        </View>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
          {[c.city, c.activity].filter(Boolean).join(" · ") || "Magyar tartalomgyártó"}
        </Text>
        <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
          {c.tiktokFollowers ? (
            <Text style={{ fontSize: 12, color: colors.text }}>
              <Text style={{ fontWeight: "700" }}>{formatNumber(c.tiktokFollowers)}</Text> TikTok
            </Text>
          ) : null}
          {c.averageRating ? (
            <Text style={{ fontSize: 12, color: colors.text }}>
              ★ {c.averageRating} ({c.reviewCount})
            </Text>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}
