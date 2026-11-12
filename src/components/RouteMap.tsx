import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MapView, { Marker, Polyline, UrlTile } from "react-native-maps";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../design-system/tokens";
import { tactile } from "../design-system/interaction";
import {
  GUAYAQUIL_BASE,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  computeHeadingDegrees,
  normalizeGuayaquilCoords,
  stopKindMeta,
  type MapThemeMode,
  type RouteMapProps,
} from "./routeMapShared";

export {
  GUAYAQUIL_BASE,
  MAP_MODE_STORAGE_KEY,
  OSM_TILE_URLS,
  computeHeadingDegrees,
  normalizeGuayaquilCoords,
  stopKindMeta,
  type MapThemeMode,
  type RouteMapProps,
  type StopKind,
} from "./routeMapShared";

export default function RouteMap({
  origin,
  destination,
  height = theme.layout.map,
  stopKind = "PICKUP",
  speedKmh = 34,
  statusLabel = "EN RUTA",
}: RouteMapProps) {
  const [mode, setMode] = useState<MapThemeMode>("tactical");
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    void AsyncStorage.getItem(MAP_MODE_STORAGE_KEY)
      .then((saved) => {
        if (mounted && (saved === "tactical" || saved === "light")) {
          setMode(saved);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const toggleMode = () => {
    tactile("selection");
    const next: MapThemeMode = mode === "tactical" ? "light" : "tactical";
    setMode(next);
    void AsyncStorage.setItem(MAP_MODE_STORAGE_KEY, next).catch(() => {});
  };

  const normalized = normalizeGuayaquilCoords(origin, destination);
  const heading = computeHeadingDegrees(
    normalized.origin,
    normalized.destination,
  );
  const stopMeta = stopKindMeta(stopKind);
  const isTactical = mode === "tactical";

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.45],
  });
  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.68, 0.25, 0],
  });

  return (
    <View
      style={[
        styles.container,
        {
          height,
          borderColor: isTactical ? "#1E293B" : theme.colors.border,
          backgroundColor: isTactical ? "#0B1320" : "#E2E8F0",
        },
      ]}
    >
      <MapView
        style={StyleSheet.absoluteFill}
        mapType="none"
        initialRegion={{
          latitude: GUAYAQUIL_BASE.latitude,
          longitude: GUAYAQUIL_BASE.longitude,
          latitudeDelta: Math.max(
            0.018,
            Math.abs(
              normalized.origin.latitude - normalized.destination.latitude,
            ) * 2.2,
          ),
          longitudeDelta: Math.max(
            0.018,
            Math.abs(
              normalized.origin.longitude - normalized.destination.longitude,
            ) * 2.2,
          ),
        }}
        accessibilityLabel="Mapa de la ruta simulada del chofer"
      >
        <UrlTile
          key={mode}
          urlTemplate={OSM_TILE_URLS[mode]}
          maximumZ={19}
          flipY={false}
        />
        <Polyline
          coordinates={[normalized.origin, normalized.destination]}
          strokeColor={isTactical ? "#38BDF8" : theme.colors.primary}
          strokeWidth={4}
          lineDashPattern={[8, 6]}
        />
        <Marker
          coordinate={normalized.origin}
          title={`Chofer · ${statusLabel}`}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.driverMarkerWrap}>
            <View
              style={[
                styles.statusBadge,
                isTactical ? styles.statusBadgeDark : styles.statusBadgeLight,
              ]}
            >
              <View style={styles.liveDot} />
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: isTactical ? "#F8FAFC" : "#0F172A" },
                ]}
              >
                {statusLabel} · {speedKmh} km/h
              </Text>
            </View>
            <View style={styles.radarCenter}>
              <Animated.View
                style={[
                  styles.radarHalo,
                  {
                    backgroundColor: isTactical ? "#38BDF8" : "#2563EB",
                    opacity: pulseOpacity,
                    transform: [{ scale: pulseScale }],
                  },
                ]}
              />
              <View
                style={[
                  styles.driverCore,
                  {
                    backgroundColor: isTactical
                      ? "#0284C7"
                      : theme.colors.primary,
                  },
                ]}
              >
                <View style={{ transform: [{ rotate: `${heading}deg` }] }}>
                  <Ionicons name="navigate" size={15} color="#FFFFFF" />
                </View>
              </View>
            </View>
          </View>
        </Marker>
        <Marker
          coordinate={normalized.destination}
          title={stopMeta.label}
          description={destination.addressFull}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.destMarkerWrap}>
            <View
              style={[
                styles.stopKindPill,
                { backgroundColor: stopMeta.color },
              ]}
            >
              <Text style={styles.stopKindText}>{stopMeta.label}</Text>
            </View>
            <View
              style={[
                styles.destRing,
                {
                  backgroundColor: stopMeta.ringBg,
                  borderColor: stopMeta.color,
                },
              ]}
            >
              <View
                style={[styles.destCore, { backgroundColor: stopMeta.color }]}
              >
                <Ionicons name={stopMeta.icon} size={14} color="#0F172A" />
              </View>
            </View>
            <View
              style={[
                styles.destLabelBox,
                isTactical ? styles.statusBadgeDark : styles.statusBadgeLight,
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.destLabelText,
                  { color: isTactical ? "#E2E8F0" : "#1E293B" },
                ]}
              >
                {destination.addressFull}
              </Text>
            </View>
          </View>
        </Marker>
      </MapView>

      <View style={styles.topOverlay} pointerEvents="box-none">
        <View
          style={[
            styles.cityBadge,
            isTactical ? styles.overlayDark : styles.overlayLight,
          ]}
        >
          <MaterialCommunityIcons
            name="radar"
            size={15}
            color={isTactical ? "#38BDF8" : theme.colors.primary}
          />
          <Text
            style={[
              styles.cityBadgeText,
              { color: isTactical ? "#F1F5F9" : "#0F172A" },
            ]}
          >
            Guayaquil · {GUAYAQUIL_BASE.latitude.toFixed(4)},{" "}
            {GUAYAQUIL_BASE.longitude.toFixed(4)}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            isTactical
              ? "Cambiar a modo día claro"
              : "Cambiar a modo táctico nocturno"
          }
          onPress={toggleMode}
          style={({ pressed }) => [
            styles.modePill,
            isTactical ? styles.overlayDark : styles.overlayLight,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Ionicons
            name={isTactical ? "moon" : "sunny"}
            size={14}
            color={isTactical ? "#38BDF8" : "#D97706"}
          />
          <Text
            style={[
              styles.modePillText,
              { color: isTactical ? "#F8FAFC" : "#0F172A" },
            ]}
          >
            {isTactical ? "Táctico Nocturno" : "Día Claro"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: theme.radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  topOverlay: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  overlayDark: {
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderColor: "rgba(56, 189, 248, 0.35)",
  },
  overlayLight: {
    backgroundColor: "rgba(255, 255, 255, 0.94)",
    borderColor: "rgba(20, 63, 115, 0.22)",
  },
  cityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
  },
  cityBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  modePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    minHeight: 34,
  },
  modePillText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
  },
  driverMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  statusBadgeDark: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderColor: "rgba(56, 189, 248, 0.45)",
  },
  statusBadgeLight: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderColor: "rgba(20, 63, 115, 0.25)",
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A5CD39",
  },
  statusBadgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
  },
  radarCenter: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  radarHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  driverCore: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destMarkerWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  stopKindPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.pill,
    marginBottom: 3,
  },
  stopKindText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.4,
  },
  destRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  destCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  destLabelBox: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    maxWidth: 155,
  },
  destLabelText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
});
