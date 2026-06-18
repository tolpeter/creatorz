import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchThread, sendThreadMessage, type ThreadMessage } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function ThreadScreen() {
  const { partnerId } = useLocalSearchParams<{ partnerId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ThreadMessage>>(null);

  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [partnerName, setPartnerName] = useState("Beszélgetés");
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchThread(String(partnerId));
      setMessages(res.messages);
      setPartnerName(res.partner.name);
    } catch {
      // némán
    } finally {
      setLoading(false);
    }
  }, [partnerId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    // optimista megjelenítés
    const optimistic: ThreadMessage = {
      id: `tmp-${Date.now()}`,
      fromUserId: "me",
      body,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setMessages((m) => [...m, optimistic]);
    setText("");
    try {
      await sendThreadMessage(String(partnerId), body);
      await load();
    } catch {
      // hiba esetén visszajelzés helyett újratöltés
      await load();
    } finally {
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
      style={{ flex: 1, backgroundColor: colors.surfaceMuted }}
    >
      {/* Fejléc */}
      <View
        style={{
          paddingTop: insets.top + 6,
          paddingBottom: 10,
          paddingHorizontal: 12,
          backgroundColor: colors.bg,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }} numberOfLines={1}>
          {partnerName}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.mine ? "flex-end" : "flex-start",
                maxWidth: "82%",
                backgroundColor: item.mine ? colors.accent : colors.surface,
                borderRadius: radius.lg,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: item.mine ? "#0a0a0a" : colors.text, fontSize: 15, lineHeight: 20 }}>
                {item.body}
              </Text>
            </View>
          )}
        />
      )}

      {/* Beviteli sáv */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 8,
          padding: 10,
          paddingBottom: Math.max(insets.bottom, 10),
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Írj üzenetet…"
          placeholderTextColor={colors.muted}
          multiline
          style={{
            flex: 1,
            maxHeight: 120,
            backgroundColor: colors.surfaceMuted,
            borderRadius: radius.lg,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 15,
          }}
        />
        <Pressable
          onPress={onSend}
          disabled={sending || !text.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: text.trim() ? colors.bg : colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="send" size={18} color={text.trim() ? colors.accent : colors.muted} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
