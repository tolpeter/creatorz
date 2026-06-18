import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { colors } from "@/lib/theme";

export default function AdsScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceMuted, padding: 32 }}>
      <Ionicons name="megaphone-outline" size={48} color={colors.accentDark} />
      <Text style={{ fontSize: 18, fontWeight: "800", marginTop: 16 }}>Hirdetések</Text>
      <Text style={{ color: colors.muted, textAlign: "center", marginTop: 6 }}>
        Hamarosan: böngészd a márka-hirdetéseket és pályázz egy kattintással.
      </Text>
    </View>
  );
}
