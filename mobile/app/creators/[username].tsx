import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetchCreator, type CreatorDetail } from "@/lib/api";
import { colors, radius } from "@/lib/theme";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://creatorz.hu";

function fmt(n: number | null | undefined) {
  return n == null ? "—" : n.toLocaleString("hu-HU");
}
function openUrl(url: string | null) {
  if (!url) return;
  Linking.openURL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
}

export default function CreatorDetailScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<CreatorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchCreator(String(username))
      .then((d) => alive && setData(d))
      .catch(() => alive && setError(true))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [username]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      {/* Fejléc-sáv (vissza) */}
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
          {data?.profile.displayName ?? "Profil"}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accentDark} size="large" />
        </View>
      ) : error || !data ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text style={{ color: colors.muted }}>Nem sikerült betölteni a profilt.</Text>
        </View>
      ) : (
        <Detail data={data} />
      )}
    </View>
  );
}

function Detail({ data }: { data: CreatorDetail }) {
  const p = data.profile;
  const socials = [
    { icon: "logo-tiktok", label: "TikTok", url: p.tiktokUrl, count: p.tiktokFollowers },
    { icon: "logo-instagram", label: "Instagram", url: p.instagramUrl, count: p.instagramFollowers },
    { icon: "logo-youtube", label: "YouTube", url: p.youtubeUrl, count: p.youtubeSubscribers },
    { icon: "logo-facebook", label: "Facebook", url: p.facebookUrl, count: p.facebookFollowers },
  ].filter((s) => s.url) as { icon: keyof typeof Ionicons.glyphMap; label: string; url: string; count: number | null }[];

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Hero */}
      <View style={{ backgroundColor: colors.bg, paddingHorizontal: 16, paddingBottom: 18 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {p.avatarUrl ? (
            <Image source={{ uri: p.avatarUrl }} style={{ width: 84, height: 84, borderRadius: 42 }} />
          ) : (
            <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: "#1a1c19", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: colors.accent, fontWeight: "900", fontSize: 28 }}>
                {p.displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 22 }} numberOfLines={1}>
                {p.displayName}
              </Text>
              {p.verified ? <Ionicons name="checkmark-circle" size={18} color={colors.accent} /> : null}
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 2 }} numberOfLines={1}>
              {[p.city, p.activity].filter(Boolean).join(" · ") || `@${p.username}`}
            </Text>
            {p.isFeatured ? (
              <View style={{ alignSelf: "flex-start", marginTop: 6, backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 11 }}>★ Kiemelt</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Kategóriák */}
        {p.categories.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
            {p.categories.map((c) => (
              <View key={c} style={{ backgroundColor: "rgba(255,255,255,0.1)", borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>{c}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Stat sáv */}
      <View style={{ flexDirection: "row", backgroundColor: colors.surface, marginHorizontal: 12, marginTop: -12, borderRadius: radius.lg, padding: 14, gap: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 }}>
        <Stat label="TikTok követő" value={fmt(p.tiktokFollowers)} />
        <Divider />
        <Stat label="Értékelés" value={p.averageRating ? `${p.averageRating}` : "—"} sub={`${p.reviewCount} db`} />
        <Divider />
        <Stat label="Portfólió" value={String(data.portfolio.length)} />
      </View>

      {/* Bio */}
      {p.bio ? (
        <Section title="Bemutatkozás">
          <Text style={{ color: colors.text, lineHeight: 21 }}>{p.bio}</Text>
        </Section>
      ) : null}

      {/* Social linkek */}
      {socials.length > 0 ? (
        <Section title="Közösségi jelenlét">
          <View style={{ gap: 8 }}>
            {socials.map((s) => (
              <Pressable
                key={s.label}
                onPress={() => openUrl(s.url)}
                style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 12 }}
              >
                <Ionicons name={s.icon} size={22} color={colors.text} />
                <Text style={{ fontWeight: "700", flex: 1 }}>{s.label}</Text>
                <Text style={{ color: colors.muted }}>{fmt(s.count)}</Text>
                <Ionicons name="open-outline" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        </Section>
      ) : null}

      {/* Portfólió */}
      {data.portfolio.length > 0 ? (
        <Section title="Portfólió">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {data.portfolio.map((item) => {
              const thumb = item.thumbnailUrl ?? (item.type === "photo" ? item.url : null);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openUrl(item.externalUrl ?? item.url)}
                  style={{ width: "31.5%", aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#e9ecdf" }}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={{ width: "100%", height: "100%" }} />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="play-circle" size={28} color={colors.accentDark} />
                    </View>
                  )}
                  {item.type === "video" ? (
                    <View style={{ position: "absolute", right: 4, bottom: 4 }}>
                      <Ionicons name="play-circle" size={20} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Section>
      ) : null}

      {/* Értékelések */}
      {data.reviews.length > 0 ? (
        <Section title={`Értékelések (${p.reviewCount})`}>
          <View style={{ gap: 10 }}>
            {data.reviews.map((r) => (
              <View key={r.id} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={{ fontWeight: "700" }}>{r.brandName}</Text>
                  <Text style={{ color: colors.accentDark, fontWeight: "800" }}>★ {r.overallRating}</Text>
                </View>
                <Text style={{ color: colors.text, marginTop: 4, lineHeight: 20 }}>{r.text}</Text>
                {r.responseText ? (
                  <Text style={{ color: colors.muted, marginTop: 6, fontStyle: "italic" }}>
                    Válasz: {r.responseText}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {/* Megnyitás a weben */}
      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        <Pressable
          onPress={() => openUrl(`${API_URL}/creators/${p.username}`)}
          style={{ backgroundColor: colors.bg, borderRadius: radius.md, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
        >
          <Ionicons name="globe-outline" size={18} color={colors.accent} />
          <Text style={{ color: "#fff", fontWeight: "700" }}>Megnyitás a weben</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontWeight: "900", fontSize: 18 }}>{value}</Text>
      <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
        {sub ? `${label} · ${sub}` : label}
      </Text>
    </View>
  );
}
function Divider() {
  return <View style={{ width: 1, backgroundColor: colors.border }} />;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
      <Text style={{ fontWeight: "800", fontSize: 16, marginBottom: 10 }}>{title}</Text>
      {children}
    </View>
  );
}
