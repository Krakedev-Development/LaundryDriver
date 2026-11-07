import { FullScreenOverlay } from "./overlay/OverlayPortal";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Body, Button, Card, contentColors, useAction } from "./ui";
import { tactile } from "../design-system/interaction";
import { useReducedMotion } from "../design-system/MotionProvider";

export function QrScanner({ onScan }: { onScan(code: string): void }) {
  const [open, setOpen] = useState(false);
  const [torch, setTorch] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const scanned = useRef(false);
  const laserAnim = useRef(new Animated.Value(0)).current;
  const reduced = useReducedMotion();
  const [permission, request] = useCameraPermissions();
  const a = useAction();

  useEffect(() => {
    if (!open) {
      setTorch(false);
      setManualMode(false);
      return;
    }
    if (reduced) {
      laserAnim.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 1900,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [open, laserAnim, reduced]);

  const laserTranslateY = laserAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 212],
  });

  const handleDetectedCode = (rawCode: string) => {
    const clean = rawCode.trim();
    if (!clean || scanned.current) return;
    scanned.current = true;
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => {});
    }
    setOpen(false);
    onScan(clean);
  };

  return (
    <>
      {a.feedback}
      <Button
        label="Escanear QR de transferencia"
        secondary
        icon="qr-code-outline"
        busy={a.busy}
        onPress={() => {
          void a.asyncRun(async () => {
            const p = permission?.granted ? permission : await request();
            if (!p.granted)
              throw Error(
                "Permite acceso a la cámara o ingresa el código manual.",
              );
            scanned.current = false;
            setManualCode("");
            setOpen(true);
          });
        }}
      />
      <FullScreenOverlay
        title="Escanear transferencia"
        visible={open}
        onClose={() => setOpen(false)}
      >
        <View style={styles.overlayContainer}>
          <Card style={styles.hudBanner}>
            <View style={styles.hudBannerRow}>
              <View style={styles.hudIconBadge}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={20}
                  color="#38BDF8"
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.hudTitle}>Visor Táctico de Custodia</Text>
                <Body style={styles.hudSubtitle}>
                  Enfoca el QR de esta solicitud o usa el teclado numérico.
                </Body>
              </View>
            </View>
          </Card>

          {open && permission?.granted && (
            <View style={styles.cameraFrame}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={(result) => {
                  handleDetectedCode(result.data);
                }}
              />

              {/* Tactical Reticle Overlay */}
              <View style={styles.reticleLayer} pointerEvents="none">
                <View style={styles.reticleBox}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />

                  <Animated.View
                    style={[
                      styles.laserLine,
                      { transform: [{ translateY: laserTranslateY }] },
                    ]}
                  />
                </View>
                <View style={styles.reticleCaptionPill}>
                  <View style={styles.reticleLiveDot} />
                  <Text style={styles.reticleCaptionText}>
                    ESCÁNER ÓPTICO ACTIVO
                  </Text>
                </View>
              </View>

              {/* Floating Tactical Controls (Torch + Keypad Toggle) */}
              <View style={styles.floatingControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    torch ? "Apagar linterna" : "Encender linterna"
                  }
                  onPress={() => {
                    tactile("light");
                    setTorch((v) => !v);
                  }}
                  style={({ pressed }) => [
                    styles.floatingBtn,
                    torch && styles.floatingBtnActive,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Ionicons
                    name={torch ? "flashlight" : "flashlight-outline"}
                    size={18}
                    color={torch ? "#0F172A" : "#F8FAFC"}
                  />
                  <Text
                    style={[
                      styles.floatingBtnText,
                      torch && styles.floatingBtnTextActive,
                    ]}
                  >
                    {torch ? "Linterna ON" : "Linterna"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Teclado numérico manual"
                  onPress={() => {
                    tactile("selection");
                    setManualMode((v) => !v);
                  }}
                  style={({ pressed }) => [
                    styles.floatingBtn,
                    manualMode && styles.floatingBtnActive,
                    { transform: [{ scale: pressed ? 0.94 : 1 }] },
                  ]}
                >
                  <Ionicons
                    name="keypad-outline"
                    size={18}
                    color={manualMode ? "#0F172A" : "#F8FAFC"}
                  />
                  <Text
                    style={[
                      styles.floatingBtnText,
                      manualMode && styles.floatingBtnTextActive,
                    ]}
                  >
                    Código manual
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {manualMode && (
            <Card style={styles.manualCard}>
              <Text style={styles.manualLabel}>
                Ingreso rápido de código numérico
              </Text>
              <View style={styles.manualRow}>
                <TextInput
                  accessibilityLabel="Código numérico de transferencia"
                  placeholder="Ej. 482910"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={manualCode}
                  onChangeText={setManualCode}
                  style={styles.manualInput}
                />
                <Button
                  label="Aplicar"
                  icon="checkmark-circle-outline"
                  disabled={!manualCode.trim()}
                  onPress={() => handleDetectedCode(manualCode)}
                />
              </View>
            </Card>
          )}

          <Button
            label="Cerrar cámara"
            secondary
            icon="close-circle-outline"
            onPress={() => setOpen(false)}
          />
        </View>
      </FullScreenOverlay>
    </>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 14,
  },
  hudBanner: {
    backgroundColor: "#0F172A",
    borderColor: "#1E293B",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  hudBannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  hudIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: "rgba(56, 189, 248, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  hudTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  hudSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: "#94A3B8",
  },
  cameraFrame: {
    height: 340,
    width: "100%",
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#090D16",
    borderWidth: 1.5,
    borderColor: "#1E293B",
    position: "relative",
  },
  reticleLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9, 13, 22, 0.28)",
  },
  reticleBox: {
    width: 228,
    height: 228,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.28)",
    backgroundColor: "rgba(15, 23, 42, 0.12)",
    position: "relative",
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: 28,
    height: 28,
    borderColor: "#A5CD39",
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  laserLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#A5CD39",
    shadowColor: "#A5CD39",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  reticleCaptionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(15, 23, 42, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  reticleLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A5CD39",
  },
  reticleCaptionText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
    color: "#E2E8F0",
    letterSpacing: 0.6,
  },
  floatingControls: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  floatingBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  floatingBtnActive: {
    backgroundColor: "#38BDF8",
    borderColor: "#BAE6FD",
  },
  floatingBtnText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#F8FAFC",
  },
  floatingBtnTextActive: {
    color: "#0F172A",
  },
  manualCard: {
    gap: 10,
    borderWidth: 1,
    borderColor: contentColors.border,
    borderRadius: 14,
  },
  manualLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: contentColors.text,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  manualInput: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: contentColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    fontWeight: "700",
    color: contentColors.text,
    backgroundColor: "#F8FAFC",
    letterSpacing: 1.5,
  },
});
