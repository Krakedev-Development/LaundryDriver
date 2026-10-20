import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AccessibilityInfo, Animated, Platform } from "react-native";
import { motion, spacing } from "./tokens";

const MotionContext = createContext(true);
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    const media =
      Platform.OS === "web" &&
      typeof window !== "undefined" &&
      window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : undefined;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduced(media?.matches ?? value);
      })
      .catch(() => {
        if (mounted) setReduced(true);
      });
    const listener = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const onChange = () => setReduced(media?.matches ?? true);
    media?.addEventListener("change", onChange);
    return () => {
      mounted = false;
      listener.remove();
      media?.removeEventListener("change", onChange);
    };
  }, []);
  return (
    <MotionContext.Provider value={reduced}>{children}</MotionContext.Provider>
  );
}
export function useReducedMotion() {
  return useContext(MotionContext);
}
export function MotionSection({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: reduced ? 0 : motion.normal,
      useNativeDriver: Platform.OS !== "web",
    });
    animation.start();
    return () => animation.stop();
  }, [progress, reduced]);
  return (
    <Animated.View
      style={{
        gap: spacing.md,
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: reduced ? [0, 0] : [spacing.xs, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
