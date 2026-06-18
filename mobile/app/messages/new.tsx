import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { startConversation } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

export default function NewMessageScreen() {
  const { username, name } = useLocalSearchParams<{ username: string; name?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSend() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await startConversation(String(username), body);
      router.replace(`/messages/${res.partnerId}`);
    } catch {
      setError("Nem sikerült elküldeni az üzenetet.");
      setSending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: colors.surfaceMuted }}
    >
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
          Üzenet — {name ?? username}
        </Text>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <Text style={{ color: colors.muted }}>
          Írd le, milyen együttműködésre gondolsz. A tartalomgyártó értesítést kap róla.
        </Text>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Mutatkozz be és írd le a projektet…"
          placeholderTextColor={colors.muted}
          multiline
          autoFocus
          style={{
            minHeight: 160,
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
            fontSize: 15,
            textAlignVertical: "top",
          }}
        />
        {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}
        <Pressable
          onPress={onSend}
          disabled={sending || !text.trim()}
          style={{
            backgroundColor: text.trim() ? colors.bg : colors.border,
            borderRadius: radius.md,
            paddingVertical: 15,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {sending ? (
            <ActivityIndicator color={colors.accent} />
          ) : (
            <Ionicons name="send" size={18} color={text.trim() ? colors.accent : colors.muted} />
          )}
          <Text style={{ color: text.trim() ? "#fff" : colors.muted, fontWeight: "700" }}>
            Üzenet küldése
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
