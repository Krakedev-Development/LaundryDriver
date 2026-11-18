import { createContext, useContext } from "react";
import type { OperationalStatus } from "../../../domain/models";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";

// El contexto vive en su propio archivo: así, al recargar en caliente el proveedor durante el
// desarrollo, no se crea un contexto nuevo que deje a las pantallas sin proveedor.

export type LocationStatus =
  | "idle" // sesión cerrada
  | "requesting" // pidiendo permiso u obteniendo la primera posición
  | "granted" // enviando la ubicación real
  | "denied" // permiso negado, se puede volver a pedir
  | "blocked" // permiso negado de forma permanente: se cambia en los ajustes del teléfono
  | "disabled" // la ubicación del teléfono está apagada
  | "error";

export const GUAYAQUIL_DEMO_COORDS = {
  latitude: -2.1894,
  longitude: -79.8891,
} as const;

export function isOutsideEcuador(latitude: number, longitude: number): boolean {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return true;
  if (latitude === 0 && longitude === 0) return true;
  return (
    latitude < -5.2 || latitude > 1.6 || longitude < -81.5 || longitude > -75.0
  );
}

export interface LiveLocationValue {
  status: LocationStatus;
  /** Pide el permiso otra vez o abre los ajustes si quedó bloqueado. */
  activate(): Promise<void>;
  /** Envía el estado operativo junto con la ubicación real, si la hay. */
  sendStatus(status: OperationalStatus): Promise<void>;
  /** Reporta coordenadas de prueba en Guayaquil (-2.1894, -79.8891) para emuladores. */
  reportGuayaquilDemo(): Promise<void>;
}

export const LiveLocationContext = createContext<LiveLocationValue | null>(null);

// Sin proveedor la pantalla no se rompe: el estado se sigue enviando, sin ubicación.
const fallback: LiveLocationValue = {
  status: "idle",
  activate: async () => {},
  sendStatus: async (status) => {
    await driverOrdersService.updateLocation({ status });
  },
  reportGuayaquilDemo: async () => {
    await driverOrdersService.updateLocation({
      latitude: -2.1894,
      longitude: -79.8891,
    });
  },
};

export function useLiveLocation(): LiveLocationValue {
  const context = useContext(LiveLocationContext);
  if (!context) {
    if (__DEV__)
      console.warn(
        "LiveLocationProvider no está montado: la ubicación no se está enviando.",
      );
    return fallback;
  }
  return context;
}
