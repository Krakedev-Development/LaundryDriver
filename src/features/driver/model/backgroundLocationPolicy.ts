import type { OperationalStatus } from "../../../domain/models";

// Reglas de la ubicación en segundo plano, sin dependencias nativas para poder probarlas.
//
// Ahorro de batería: el GPS en segundo plano solo corre cuando aporta algo.
// - Con un tramo en curso (recogida o entrega): perfil de navegación, preciso y frecuente, porque
//   el cliente ve al chofer en el mapa.
// - Disponible o en servicio sin tramo: perfil de espera, menos preciso y espaciado, solo para que
//   administración lo vea en el mapa de flota y no salte la alerta de inactividad.
// - En pausa o desconectado: apagado.

export type BackgroundProfileName = "navigation" | "standby";

export interface BackgroundProfile {
  name: BackgroundProfileName;
  /** Intervalo mínimo entre lecturas del GPS (Android). */
  timeIntervalMs: number;
  /** Distancia mínima entre lecturas. */
  distanceIntervalM: number;
  /** Intervalo mínimo entre envíos al servidor. */
  minSendIntervalMs: number;
  highAccuracy: boolean;
}

export const BACKGROUND_PROFILES: Record<BackgroundProfileName, BackgroundProfile> = {
  navigation: {
    name: "navigation",
    timeIntervalMs: 4_000,
    distanceIntervalM: 10,
    minSendIntervalMs: 4_000,
    highAccuracy: true,
  },
  standby: {
    name: "standby",
    timeIntervalMs: 30_000,
    distanceIntervalM: 50,
    minSendIntervalMs: 25_000,
    highAccuracy: false,
  },
};

// En segundo plano se aceptan lecturas algo menos precisas que con la app abierta: el teléfono
// suele bajar la precisión con la pantalla apagada. Más de esto no sirve para el mapa.
export const MAX_BACKGROUND_ACCURACY_METERS = 80;

export function backgroundProfileFor(
  operationalStatus: OperationalStatus,
  hasActiveTrackedOrder: boolean,
): BackgroundProfile | null {
  if (hasActiveTrackedOrder) return BACKGROUND_PROFILES.navigation;
  if (operationalStatus === "AVAILABLE" || operationalStatus === "ON_SERVICE")
    return BACKGROUND_PROFILES.standby;
  return null;
}

export interface BackgroundFixCandidate {
  accuracy?: number | null;
  timestamp: number;
}

/**
 * Decide si una lectura del GPS en segundo plano se envía. Con la app en primer plano no se envía:
 * ahí ya envía el seguimiento normal (watchPositionAsync con su filtro), y así no se duplica.
 */
export function shouldSendBackgroundFix(
  fix: BackgroundFixCandidate,
  options: {
    appActive: boolean;
    lastSentAt: number;
    minSendIntervalMs: number;
    now: number;
  },
): boolean {
  if (options.appActive) return false;
  if (fix.accuracy != null && fix.accuracy > MAX_BACKGROUND_ACCURACY_METERS) return false;
  // Lecturas viejas que el sistema entrega en lote: solo vale la más reciente.
  if (options.now - fix.timestamp > 60_000) return false;
  return options.now - options.lastSentAt >= options.minSendIntervalMs;
}
