import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

export function tactile(kind: "selection" | "success" | "warning" | "error") {
  if (Platform.OS === "web") return;
  const promise =
    kind === "selection"
      ? Haptics.selectionAsync()
      : Haptics.notificationAsync(
          {
            success: Haptics.NotificationFeedbackType.Success,
            warning: Haptics.NotificationFeedbackType.Warning,
            error: Haptics.NotificationFeedbackType.Error,
          }[kind],
        );
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
