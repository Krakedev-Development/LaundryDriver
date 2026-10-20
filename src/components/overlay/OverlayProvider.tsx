import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { contentTheme as theme } from "../../design-system/classic";
import {
  OverlayContext,
  type FeedbackKind,
  type OverlayEntry,
} from "./OverlayContext";
import { OverlayHost } from "./OverlayHost";
type ToastState = { message: string; kind: FeedbackKind; id: number };
function Toast({ toast, onClose }: { toast: ToastState; onClose(): void }) {
  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      aria-live="polite"
      style={{
        backgroundColor: theme.colors.dark,
        borderRadius: theme.radius.md,
        padding: theme.spacing.sm,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.spacing.sm,
      }}
    >
      <Ionicons
        name={
          toast.kind === "warning"
            ? "alert-circle-outline"
            : toast.kind === "info"
              ? "information-circle-outline"
              : "checkmark-circle-outline"
        }
        size={24}
        color={theme.colors.onPrimary}
      />
      <Text
        style={{
          ...theme.typography.secondary,
          color: theme.colors.onPrimary,
          flex: 1,
        }}
      >
        {toast.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar aviso"
        onPress={onClose}
        style={{
          minWidth: theme.layout.touch,
          minHeight: theme.layout.touch,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="close" size={20} color={theme.colors.onPrimary} />
      </Pressable>
    </View>
  );
}
export function OverlayProvider({ children }: { children: React.ReactNode }) {
  const [entry, setEntry] = useState<OverlayEntry | null>(null),
    active = useRef<OverlayEntry | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null),
    { bottom } = useSafeAreaInsets(),
    serial = useRef(0);
  const present = useCallback((next: OverlayEntry) => {
    if (active.current && active.current.id !== next.id)
      active.current.onClose();
    active.current = next;
    setEntry(next);
  }, []);
  const dismiss = useCallback((id: string) => {
    if (active.current?.id === id) {
      active.current = null;
      setEntry(null);
    }
  }, []);
  const close = useCallback(() => {
    const current = active.current;
    if (current) {
      current.onClose();
      dismiss(current.id);
    }
  }, [dismiss]);
  const notify = useCallback(
    (message: string, kind: FeedbackKind = "success") =>
      setToast({ message, kind, id: ++serial.current }),
    [],
  );
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), theme.motion.toast);
    return () => clearTimeout(timer);
  }, [toast]);
  const value = useMemo(
    () => ({ present, dismiss, notify }),
    [present, dismiss, notify],
  );
  const feedback = toast ? (
    <Toast toast={toast} onClose={() => setToast(null)} />
  ) : null;
  return (
    <OverlayContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <OverlayHost entry={entry} onClose={close} feedback={feedback} />
        {toast && !entry && (
          <View
            style={{
              position: "absolute",
              bottom: bottom + theme.layout.button + theme.spacing.md,
              left: theme.spacing.lg,
              right: theme.spacing.lg,
              maxWidth: theme.layout.maxWidth,
              alignSelf: "center",
              zIndex: theme.zIndex.feedback,
            }}
          >
            {feedback}
          </View>
        )}
      </View>
    </OverlayContext.Provider>
  );
}
