import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import {
  notificationsService,
  type DevicePlatform,
} from "./notificationsService";

export const PUSH_TOKEN_STORAGE_KEY = "laundry.driver.expoPushToken";

export interface PushNotificationData {
  type?: string;
  orderId?: string;
  category?: string;
  notificationId?: string;
}

let handlerConfigured = false;

async function ensureHandler(): Promise<typeof import("expo-notifications") | null> {
  if (Platform.OS === "web") return null;
  try {
    const Notifications = await import("expo-notifications");
    if (!handlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      handlerConfigured = true;
    }
    return Notifications;
  } catch {
    return null;
  }
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  const Notifications = await ensureHandler();
  if (!Notifications) return null;

  try {
    const Device = await import("expo-device");
    if (!Device.isDevice) return null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("assignments", {
        name: "Asignaciones",
        importance: Notifications.AndroidImportance.MAX,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
      await Notifications.setNotificationChannelAsync("chat", {
        name: "Mensajes de pedido",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let finalStatus = existing.status;
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }
    if (finalStatus !== "granted") return null;

    const projectId =
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim() ||
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)
        ?.eas?.projectId;

    const tokenResponse = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const expoToken = tokenResponse?.data?.trim();
    if (!expoToken) return null;

    const platform: DevicePlatform =
      Platform.OS === "ios"
        ? "IOS"
        : Platform.OS === "android"
          ? "ANDROID"
          : "WEB";

    await notificationsService.registerDeviceToken({
      token: expoToken,
      platform,
      appType: "DRIVER",
      deviceName: Device.modelName ?? undefined,
    });
    await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, expoToken);
    return expoToken;
  } catch {
    return null;
  }
}

export async function unregisterPushNotificationsAsync(
  explicitAccessToken?: string | null,
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const storedToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (storedToken) {
      await notificationsService
        .unregisterDeviceToken(storedToken, explicitAccessToken)
        .catch(() => {});
      await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY).catch(() => {});
    }
  } catch {
    // Best-effort cleanup
  }
}

export function subscribeNotificationResponses(
  onOpen: (data: PushNotificationData) => void,
): () => void {
  if (Platform.OS === "web") return () => {};
  let active = true;
  let subscription: { remove(): void } | null = null;

  void ensureHandler().then(async (Notifications) => {
    if (!active || !Notifications) return;
    subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = (response?.notification?.request?.content?.data ??
          {}) as PushNotificationData;
        onOpen(data);
      },
    );
    const initial = await Notifications.getLastNotificationResponseAsync().catch(
      () => null,
    );
    if (active && initial) {
      const data = (initial.notification?.request?.content?.data ??
        {}) as PushNotificationData;
      if (data.orderId || data.type) {
        onOpen(data);
      }
    }
  });

  return () => {
    active = false;
    subscription?.remove();
  };
}
