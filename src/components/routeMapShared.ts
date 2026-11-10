import type { Leg } from "../domain/models";

export const GUAYAQUIL_BASE = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export const MAP_MODE_STORAGE_KEY = "laundry.driver-map-theme-mode.v1";

export const OSM_TILE_URLS = {
  tactical: "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
  light: "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
} as const;

export type MapThemeMode = keyof typeof OSM_TILE_URLS;
export type StopKind = "PICKUP" | "DELIVERY" | "FACILITY";

/** Normalizes legacy demo coordinates around Guayaquil base (-2.1894, -79.8891). */
export function normalizeGuayaquilCoords(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
) {
  const isLegacyOrigin = origin.latitude < -8 || origin.latitude === 0;
  const isLegacyDest = destination.latitude < -8 || destination.latitude === 0;

  if (!isLegacyOrigin && !isLegacyDest) {
    return { origin, destination };
  }

  const dLat =
    isLegacyOrigin && isLegacyDest
      ? Math.max(-0.025, Math.min(0.025, origin.latitude - destination.latitude))
      : 0.008;
  const dLng =
    isLegacyOrigin && isLegacyDest
      ? Math.max(
          -0.025,
          Math.min(0.025, origin.longitude - destination.longitude),
        )
      : -0.009;

  const normDest = isLegacyDest
    ? {
        latitude: GUAYAQUIL_BASE.latitude - 0.0032,
        longitude: GUAYAQUIL_BASE.longitude + 0.0038,
      }
    : destination;

  const normOrigin = isLegacyOrigin
    ? {
        latitude: normDest.latitude + (dLat || 0.0064),
        longitude: normDest.longitude + (dLng || -0.0076),
      }
    : origin;

  return { origin: normOrigin, destination: normDest };
}

export function computeHeadingDegrees(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): number {
  const dy = destination.latitude - origin.latitude;
  const dx = destination.longitude - origin.longitude;
  const angle = (Math.atan2(dx, dy) * 180) / Math.PI;
  return Math.round((angle + 360) % 360);
}

export function stopKindMeta(kind: StopKind) {
  if (kind === "PICKUP") {
    return {
      label: "RECOGIDA",
      shortLabel: "Pickup",
      color: "#F59E0B",
      ringBg: "rgba(245, 158, 11, 0.26)",
      icon: "cube" as const,
    };
  }
  if (kind === "FACILITY") {
    return {
      label: "PLANTA CENTRAL",
      shortLabel: "Planta",
      color: "#38BDF8",
      ringBg: "rgba(56, 189, 248, 0.26)",
      icon: "business" as const,
    };
  }
  return {
    label: "ENTREGA",
    shortLabel: "Delivery",
    color: "#A5CD39",
    ringBg: "rgba(165, 205, 57, 0.28)",
    icon: "checkmark-done-circle" as const,
  };
}

export interface RouteMapProps {
  height?: number;
  origin: { latitude: number; longitude: number };
  destination: Pick<Leg, "latitude" | "longitude" | "addressFull">;
  stopKind?: StopKind;
  speedKmh?: number;
  statusLabel?: string;
}

