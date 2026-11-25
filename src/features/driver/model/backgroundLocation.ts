import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { AppState, Platform } from "react-native";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";
import { driverSocketService } from "../../../services/realtime/driverSocketService";
import {
  shouldSendBackgroundFix,
  type BackgroundProfile,
} from "./backgroundLocationPolicy";

// Ubicación del chofer con la pantalla bloqueada o con otra app encima (Google Maps, Waze).
//
// watchPositionAsync se detiene cuando la app pasa a segundo plano. Para seguir enviando se usa
// una tarea de expo-task-manager con startLocationUpdatesAsync: en Android corre como servicio en
// primer plano (con una notificación fija) y en iOS con el modo de fondo "location".
//
// Requiere una compilación propia de la app (no funciona en Expo Go) y el permiso de ubicación
// "Permitir siempre". La tarea se define al cargar este módulo, que se importa desde index.js:
// así existe también cuando el sistema reabre la app solo para entregarle ubicaciones.

export const BACKGROUND_LOCATION_TASK = "laundry-driver-background-location";

// Contexto que la pantalla comparte con la tarea (que corre fuera de React).
let trackedOrderId: string | null = null;
let currentProfile: BackgroundProfile | null = null;
let lastSentAt = 0;

export function setBackgroundTrackedOrder(orderId: string | null): void {
  trackedOrderId = orderId;
}

const supported = Platform.OS === "android" || Platform.OS === "ios";

interface TaskBody {
  locations?: Location.LocationObject[];
}

async function sendBackgroundFix(location: Location.LocationObject): Promise<void> {
  const { latitude, longitude, heading, speed } = location.coords;
  const meta = {
    heading: heading != null && heading >= 0 ? heading : undefined,
    speed: speed != null && speed >= 0 ? speed : undefined,
  };
  const sentViaWs = driverSocketService.updateLocation({
    lat: latitude,
    lng: longitude,
    ...meta,
    orderId: trackedOrderId ?? undefined,
  });
  // Con el socket suspendido (frecuente en segundo plano) se usa el respaldo REST.
  if (!sentViaWs) {
    await driverOrdersService.updateLocation({ latitude, longitude, ...meta });
  }
}

if (supported) {
  try {
    TaskManager.defineTask<TaskBody>(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
      if (error || !data?.locations?.length) return;
      // El sistema puede entregar varias lecturas juntas: solo importa la más reciente.
      const latest = data.locations.reduce((a, b) => (b.timestamp > a.timestamp ? b : a));
      const now = Date.now();
      const send = shouldSendBackgroundFix(
        { accuracy: latest.coords.accuracy, timestamp: latest.timestamp },
        {
          appActive: AppState.currentState === "active",
          lastSentAt,
          minSendIntervalMs: currentProfile?.minSendIntervalMs ?? 4_000,
          now,
        },
      );
      if (!send) return;
      lastSentAt = now;
      try {
        await sendBackgroundFix(latest);
      } catch {
        // Sin conexión o sesión vencida: la siguiente lectura lo vuelve a intentar.
      }
    });
  } catch {
    // Entornos sin el módulo nativo (Expo Go): la app sigue con el seguimiento en primer plano.
  }
}

export type BackgroundAvailability =
  | "unsupported" // web o Expo Go: no hay tareas en segundo plano
  | "needs_permission" // falta "Permitir siempre"
  | "ready";

export async function backgroundAvailability(): Promise<BackgroundAvailability> {
  if (!supported) return "unsupported";
  try {
    if (!(await TaskManager.isAvailableAsync())) return "unsupported";
    const permission = await Location.getBackgroundPermissionsAsync();
    return permission.status === "granted" ? "ready" : "needs_permission";
  } catch {
    return "unsupported";
  }
}

/** Pide "Permitir siempre". Debe llamarse con el permiso de primer plano ya concedido. */
export async function requestBackgroundPermission(): Promise<BackgroundAvailability> {
  if (!supported) return "unsupported";
  try {
    if (!(await TaskManager.isAvailableAsync())) return "unsupported";
    const permission = await Location.requestBackgroundPermissionsAsync();
    return permission.status === "granted" ? "ready" : "needs_permission";
  } catch {
    return "unsupported";
  }
}

/**
 * Arranca (o ajusta) la tarea con el perfil indicado. Con perfil nulo la detiene. No pide
 * permisos: si falta "Permitir siempre" no hace nada y lo informa.
 */
export async function syncBackgroundTracking(
  profile: BackgroundProfile | null,
): Promise<BackgroundAvailability> {
  const availability = await backgroundAvailability();
  if (availability !== "ready" || !profile) {
    await stopBackgroundTracking();
    return availability;
  }
  const running = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(
    () => false,
  );
  if (running && currentProfile?.name === profile.name) return "ready";
  if (running) await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => {});
  currentProfile = profile;
  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: profile.highAccuracy
      ? Location.Accuracy.BestForNavigation
      : Location.Accuracy.Balanced,
    timeInterval: profile.timeIntervalMs,
    distanceInterval: profile.distanceIntervalM,
    // iOS: no pausar solo cuando el chofer se detiene en un semáforo o en el domicilio.
    pausesUpdatesAutomatically: false,
    activityType: Location.ActivityType.AutomotiveNavigation,
    showsBackgroundLocationIndicator: true,
    // Android: servicio en primer plano; sin él el sistema corta la ubicación en minutos.
    foregroundService: {
      notificationTitle: "Laundry Driver",
      notificationBody:
        profile.name === "navigation"
          ? "Compartiendo tu ubicación con el cliente durante el servicio."
          : "Compartiendo tu ubicación con administración mientras estás disponible.",
      notificationColor: "#143F73",
      killServiceOnDestroy: true,
    },
  });
  return "ready";
}

export async function stopBackgroundTracking(): Promise<void> {
  currentProfile = null;
  if (!supported) return;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK))
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  } catch {
    // La tarea no estaba registrada.
  }
}
