import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { registerPushToken } from "./api";

// Foreground értesítések megjelenítése.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Engedély + Expo push token lekérése és elküldése a szervernek.
 * Best-effort: Expo Go-ban / EAS projectId nélkül csendben nem csinál semmit.
 * Valódi push fogadásához EAS dev/production build kell.
 */
export async function registerForPush() {
  try {
    if (!Device.isDevice) return;

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Alapértelmezett",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      // @ts-expect-error – régebbi mező
      Constants.easConfig?.projectId;
    if (!projectId) return; // EAS projekt nélkül nincs token

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    if (tokenData?.data) {
      await registerPushToken(tokenData.data, Platform.OS);
    }
  } catch {
    // best-effort
  }
}
