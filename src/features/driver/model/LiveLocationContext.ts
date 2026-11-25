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

// La ubicación de prueba en Guayaquil sirve solo para emuladores durante el desarrollo. En la app
// compilada para los choferes (__DEV__ falso) no se ofrece ni se envía: la asignación depende de
// la ubicación real y un chofer no debe poder declararse en otro lugar.
export const DEMO_LOCATION_ENABLED = __DEV__;
const DEMO_DISABLED_MESSAGE = "La ubicación de prueba solo está disponible en desarrollo.";

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

/** Ubicación con la pantalla bloqueada o con otra app encima (Google Maps, Waze). */
export type BackgroundLocationStatus =
  | "idle" // sin ubicación en primer plano todavía
  | "unsupported" // web o Expo Go: solo hay seguimiento con la app abierta
  | "needs_permission" // falta el permiso "Permitir siempre"
  | "ready";

export interface LiveLocationValue {
  status: LocationStatus;
  background: BackgroundLocationStatus;
  /** Pide "Permitir siempre" (o abre los ajustes) y arranca el seguimiento en segundo plano. */
  enableBackground(): Promise<void>;
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
  background: "idle",
  enableBackground: async () => {},
  activate: async () => {},
  sendStatus: async (status) => {
    await driverOrdersService.updateLocation({ status });
  },
  reportGuayaquilDemo: async () => {
    if (!DEMO_LOCATION_ENABLED) throw Error(DEMO_DISABLED_MESSAGE);
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
