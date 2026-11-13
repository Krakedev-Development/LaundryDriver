import { facilities } from "../../domain/catalog";
import { pickupStatuses, type Order } from "../../domain/models";

export const GUAYAQUIL_FALLBACK = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export interface NavigationTarget {
  latitude: number;
  longitude: number;
  addressFull: string;
  isPickup: boolean;
  stopKind: "PICKUP" | "DELIVERY" | "FACILITY";
}

function isValidCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value !== 0;
}

export function buildGoogleMapsDirectionsUrl(
  latitude: number,
  longitude: number,
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

export function buildWazeDirectionsUrl(
  latitude: number,
  longitude: number,
): string {
  return `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
}

export function resolveOrderNavigationTarget(order: Order): NavigationTarget {
  if (["PICKED_UP", "HEADING_TO_FACILITY"].includes(order.status)) {
    const facility = facilities.find(
      (f) => f.name === order.facilityName || f.id === order.facilityName,
    );
    return {
      latitude: facility?.latitude ?? GUAYAQUIL_FALLBACK.latitude,
      longitude: facility?.longitude ?? GUAYAQUIL_FALLBACK.longitude,
      addressFull:
        facility?.address ?? (order.facilityName || "Planta Central Guayaquil"),
      isPickup: false,
      stopKind: "FACILITY",
    };
  }

  const isPickup = pickupStatuses.includes(order.status);
  const leg = isPickup
    ? order.fulfillmentPlan.inbound
    : order.fulfillmentPlan.outbound;
  const addressFull =
    (isPickup ? order.pickup.addressFull : order.delivery.addressFull) ||
    leg?.addressFull ||
    (isPickup ? "Punto de recogida Guayaquil" : "Punto de entrega Guayaquil");

  const latitude = isValidCoordinate(leg?.latitude)
    ? leg.latitude
    : GUAYAQUIL_FALLBACK.latitude;
  const longitude = isValidCoordinate(leg?.longitude)
    ? leg.longitude
    : GUAYAQUIL_FALLBACK.longitude;

  return {
    latitude,
    longitude,
    addressFull,
    isPickup,
    stopKind: isPickup ? "PICKUP" : "DELIVERY",
  };
}
