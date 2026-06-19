import { useCallback, useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/auth";
import { registerForPush } from "@/lib/push-register";
import { fetchUnread } from "@/lib/api";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const [unread, setUnread] = useState({ messages: 0, notifications: 0 });

  const refreshUnread = useCallback(() => {
    fetchUnread()
      .then(setUnread)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!session) return;
    registerForPush();
    refreshUnread();
    const t = setInterval(refreshUnread, 30000);
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as { type?: string };
      if (data?.type === "message") router.push("/(tabs)/messages");
      else router.push("/notifications");
    });
    return () => {
      clearInterval(t);
      sub.remove();
    };
  }, [session, router, refreshUnread]);

  if (!loading && !session) return <Redirect href="/(auth)/login" />;

  const Bell = () => (
    <Pressable onPress={() => router.push("/notifications")} hitSlop={10} style={{ marginRight: 14 }}>
      <Ionicons name="notifications-outline" size={22} color={colors.textOnDark} />
      {unread.notifications > 0 && (
        <View
          style={{
            position: "absolute",
            top: -3,
            right: -3,
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            backgroundColor: colors.accent,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <View />
        </View>
      )}
    </Pressable>
  );

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.textOnDark, fontWeight: "800" },
        headerTintColor: colors.textOnDark,
        headerRight: () => <Bell />,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Tartalomgyártók",
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ads"
        options={{
          title: "Hirdetések",
          tabBarIcon: ({ color, size }) => <Ionicons name="megaphone" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Üzenetek",
          tabBarBadge: unread.messages > 0 ? unread.messages : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: "#000" },
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
