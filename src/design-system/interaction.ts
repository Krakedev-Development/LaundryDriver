import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export type TactileKind =
  | "selection"
  | "light"
  | "medium"
  | "success"
  | "warning"
  | "error";

export function tactile(kind: TactileKind) {
  if (Platform.OS === "web") return;
  let promise: Promise<void>;
  if (kind === "selection") {
    promise = Haptics.selectionAsync();
  } else if (kind === "light") {
    promise = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else if (kind === "medium") {
    promise = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } else {
    promise = Haptics.notificationAsync(
      {
        success: Haptics.NotificationFeedbackType.Success,
        warning: Haptics.NotificationFeedbackType.Warning,
        error: Haptics.NotificationFeedbackType.Error,
      }[kind],
    );
  }
  void promise.catch(() => {});
}
export function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return !message ||
    /http\s*\d{3}|network request|fetch failed|unhandled|exception|stack trace/i.test(
      message,
    )
    ? "No pudimos completar esta acción. Inténtalo de nuevo."
    : message;
}
