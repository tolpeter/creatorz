import { useCallback, useState } from "react";
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
import { useFocusEffect, useRouter } from "expo-router";
import { fetchConversations, type Conversation } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function MessagesScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchConversations();
      setItems(res.conversations);
    } catch {
      // némán
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
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
        keyExtractor={(c) => c.partnerId}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.accentDark}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32 }}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.muted} />
            <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
              Még nincs üzeneted. A beszélgetések itt jelennek meg.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/messages/${item.partnerId}`)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: colors.surface,
              borderRadius: radius.lg,
              padding: 12,
            }}
          >
            {item.avatarUrl ? (
              <Image source={{ uri: item.avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24 }} />
            ) : (
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#e9ecdf", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontWeight: "800", color: colors.accentDark }}>{item.name.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontWeight: "700", fontSize: 15 }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
                {item.lastBody}
              </Text>
            </View>
            {item.unread > 0 ? (
              <View style={{ backgroundColor: colors.accent, borderRadius: 999, minWidth: 22, height: 22, alignItems: "center", justifyContent: "center", paddingHorizontal: 6 }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 12 }}>{item.unread}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            )}
          </Pressable>
        )}
      />
    </View>
  );
}
