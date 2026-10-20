import { useEffect, useRef, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  findNodeHandle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { contentTheme as theme } from "../../design-system/classic";
import { useReducedMotion } from "../../design-system/MotionProvider";
import type { OverlayEntry } from "./OverlayContext";

export function OverlayHost({
  entry,
  onClose,
  feedback,
}: {
  entry: OverlayEntry | null;
  onClose(): void;
  feedback?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const { height } = useWindowDimensions();
  const progress = useRef(new Animated.Value(0)).current;
  const drag = useRef(new Animated.Value(0)).current;
  const heading = useRef<Text>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  useEffect(() => {
    drag.setValue(0);
    progress.setValue(reduced ? 1 : 0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : theme.motion.sheet,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [entry?.id, progress, drag, reduced]);
  const responder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) =>
        drag.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 90 || gesture.vy > 0.8) close.current();
        else if (reducedRef.current) drag.setValue(0);
        else
          Animated.spring(drag, {
            toValue: 0,
            useNativeDriver: Platform.OS !== "web",
          }).start();
      },
      onPanResponderTerminate: () => drag.setValue(0),
    }),
  ).current;
  if (!entry) return null;
  const sheet = entry.kind === "sheet";
  const drawer = entry.kind === "drawer";
  const full = entry.kind === "full";
  const panel = (
    <Animated.View
      accessibilityViewIsModal
      aria-modal
      accessibilityRole="none"
      onAccessibilityEscape={onClose}
      style={{
        width: drawer ? "87%" : "100%",
        maxWidth: drawer
          ? theme.layout.drawerMaxWidth
          : full
            ? undefined
            : theme.layout.sheetMaxWidth,
        maxHeight: full || drawer ? "100%" : height * 0.9,
        height: full || drawer ? "100%" : undefined,
        backgroundColor: theme.colors.surface,
        borderRadius: drawer || full ? 0 : theme.radius.xl,
        borderBottomLeftRadius: sheet
          ? 0
          : drawer || full
            ? 0
            : theme.radius.xl,
        borderBottomRightRadius: sheet
          ? 0
          : drawer || full
            ? 0
            : theme.radius.xl,
        overflow: "hidden",
        opacity: progress,
        transform: [
          {
            translateY: sheet
              ? Animated.add(
                  drag,
                  progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: reduced ? [0, 0] : [theme.spacing.xxl, 0],
                  }),
                )
              : 0,
          },
        ],
      }}
    >
      {sheet && (
        <View
          {...(entry.dismissible === false ? {} : responder.panHandlers)}
          style={{
            minHeight: theme.layout.touch,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: theme.spacing.huge,
              height: theme.spacing.xxs,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.border,
            }}
          />
        </View>
      )}
      <SafeAreaView
        edges={full || drawer ? ["top", "bottom"] : ["bottom"]}
        style={{ flexShrink: 1, flex: full || drawer ? 1 : undefined }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: theme.spacing.lg,
            paddingTop: sheet ? 0 : theme.spacing.md,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <Text
            ref={heading}
            accessibilityRole="header"
            style={{
              ...theme.typography.section,
              color: theme.colors.text,
              flex: 1,
            }}
          >
            {entry.title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar panel"
            onPress={onClose}
            style={{
              width: theme.layout.touch,
              minHeight: theme.layout.touch,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="close-outline"
              size={24}
              color={theme.colors.text}
            />
          </Pressable>
        </View>
        {feedback && (
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingBottom: theme.spacing.sm,
            }}
          >
            {feedback}
          </View>
        )}
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={{ flexShrink: 1 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: theme.spacing.lg,
            gap: theme.spacing.md,
          }}
        >
          {entry.children}
        </ScrollView>
        {entry.footer && (
          <View
            style={{
              padding: theme.spacing.lg,
              borderTopWidth: 1,
              borderColor: theme.colors.divider,
              gap: theme.spacing.xs,
            }}
          >
            {entry.footer}
          </View>
        )}
      </SafeAreaView>
    </Animated.View>
  );
  return (
    <Modal
      transparent={!full}
      visible
      animationType="none"
      onRequestClose={onClose}
      onShow={() => {
        if (Platform.OS !== "web") {
          const node = findNodeHandle(heading.current);
          if (node) AccessibilityInfo.setAccessibilityFocus(node);
        }
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          flex: 1,
          justifyContent:
            drawer || full ? "flex-start" : sheet ? "flex-end" : "center",
          alignItems: drawer ? "flex-start" : "center",
          padding: sheet || drawer || full ? 0 : theme.spacing.lg,
          backgroundColor: full
            ? theme.colors.background
            : theme.colors.overlay,
        }}
      >
        {!full && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar panel tocando fuera"
            disabled={entry.dismissible === false}
            onPress={onClose}
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
            }}
          />
        )}
        {panel}
      </KeyboardAvoidingView>
    </Modal>
  );
}
