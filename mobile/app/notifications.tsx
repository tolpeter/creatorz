import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchNotifications, markNotificationsRead, type AppNotification } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "most";
  if (m < 60) return `${m} perce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.floor(h / 24);
  return `${d} napja`;
}

const ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  message: "chatbubble-ellipses",
  application: "document-text",
  application_accepted: "checkmark-circle",
  application_rejected: "close-circle",
  ad_invitation: "megaphone",
  ad_match: "megaphone",
  saved: "heart",
};

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      setItems(res.items);
    } catch {
      // némán
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // megnyitáskor olvasottra állítjuk
    markNotificationsRead().catch(() => {});
  }, [load]);

  function go(n: AppNotification) {
    if (n.link?.startsWith("/ads/")) router.push(n.link as `/ads/${string}`);
    else if (n.type === "message") router.push("/(tabs)/messages");
    else if (n.type === "saved") router.push("/(tabs)/profile");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 12, backgroundColor: colors.bg, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>Értesítések</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32 }}>
              <Ionicons name="notifications-off-outline" size={44} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, textAlign: "center" }}>
                Nincs értesítésed.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => go(item)}
              style={{
                flexDirection: "row",
                gap: 12,
                backgroundColor: item.read ? colors.surface : "#f3f8e8",
                borderRadius: radius.lg,
                padding: 12,
                borderWidth: 1,
                borderColor: item.read ? colors.border : colors.accent,
              }}
            >
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#f0f4e5", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={ICON[item.type] ?? "notifications"} size={18} color={colors.accentDark} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ fontWeight: "700", fontSize: 14 }}>{item.title}</Text>
                {item.body ? (
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
                    {item.body}
                  </Text>
                ) : null}
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 3 }}>{ago(item.createdAt)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
