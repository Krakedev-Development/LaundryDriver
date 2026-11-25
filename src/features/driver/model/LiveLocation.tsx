import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState as Lifecycle, Linking } from "react-native";
import type { OperationalStatus } from "../../../domain/models";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";
import { driverSocketService } from "../../../services/realtime/driverSocketService";
import { useApp } from "../../../store/AppProvider";
import {
  evaluateDriverGpsFix,
  shouldPushDriverLocation,
  type AcceptedGpsFix,
  type PendingRecalibration,
} from "./gpsFilter";
import {
  DEMO_LOCATION_ENABLED,
  GUAYAQUIL_DEMO_COORDS,
  LiveLocationContext,
  type BackgroundLocationStatus,
  type LocationStatus,
} from "./LiveLocationContext";
import {
  requestBackgroundPermission,
  setBackgroundTrackedOrder,
  stopBackgroundTracking,
  syncBackgroundTracking,
} from "./backgroundLocation";
import { backgroundProfileFor } from "./backgroundLocationPolicy";
import { useOrderStatusSync } from "./orderStatusSync";

// Ubicación real del chofer: filtrada por precisión y velocidad plausible (estilo AnubisRide),
// enviada en tiempo real por WebSocket y con respaldo REST automático si el socket cae.

const HEARTBEAT_MS = 25_000;
const LIVE_TRACKED_STATUSES = new Set([
  "PICKUP_ASSIGNED",
  "HEADING_TO_PICKUP",
  "ARRIVED_FOR_PICKUP",
  "DELIVERY_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "ARRIVED_FOR_DELIVERY",
]);

interface Fix {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
}

export function LiveLocationProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const { state, execute } = useApp();
  const [status, setStatus] = useState<LocationStatus>("idle");
  // Comparte la conexión del socket: los pedidos cancelados, liberados o reprogramados se
  // actualizan en la lista del chofer al momento.
  useOrderStatusSync(enabled);
  const fix = useRef<Fix | null>(null);
  const lastSentFix = useRef<Fix | null>(null);
  const lastSentAt = useRef(0);
  const lastAcceptedGps = useRef<AcceptedGpsFix | null>(null);
  const acceptedFixCount = useRef(0);
  const pendingRecalibration = useRef<PendingRecalibration | null>(null);

  const operational = useRef(state.driver.operationalStatus);
  operational.current = state.driver.operationalStatus;

  const activeTrackedOrderId =
    state.orders.find((o) => LIVE_TRACKED_STATUSES.has(o.status))?.id ?? null;
  const activeOrderIdRef = useRef<string | null>(activeTrackedOrderId);
  activeOrderIdRef.current = activeTrackedOrderId;
  setBackgroundTrackedOrder(activeTrackedOrderId);
  const [background, setBackground] = useState<BackgroundLocationStatus>("idle");

  const subscription = useRef<Location.LocationSubscription | null>(null);
  const startRunId = useRef(0);
  const statusRef = useRef(status);
  statusRef.current = status;
  const executeRef = useRef(execute);
  executeRef.current = execute;

  const send = useCallback(async (override?: OperationalStatus) => {
    const current = fix.current;
    const opStatus = override ?? operational.current;
    if (!current) {
      if (override) {
        await driverOrdersService.updateLocation({ status: opStatus });
      }
      return;
    }

    lastSentAt.current = Date.now();
    lastSentFix.current = current;

    const sentViaWs =
      !override &&
      driverSocketService.updateLocation({
        lat: current.latitude,
        lng: current.longitude,
        heading: current.heading,
        speed: current.speed,
        orderId: activeOrderIdRef.current ?? undefined,
      });

    if (!sentViaWs) {
      await driverOrdersService.updateLocation({
        latitude: current.latitude,
        longitude: current.longitude,
        heading: current.heading,
        speed: current.speed,
        status: opStatus,
      });
    }
  }, []);

  const applyPosition = useCallback(
    (
      latitude: number,
      longitude: number,
      meta: { heading?: number; speed?: number; accuracy?: number } = {},
      forceSend = false,
    ) => {
      const now = Date.now();
      if (!forceSend) {
        const decision = evaluateDriverGpsFix(
          {
            latitude,
            longitude,
            accuracy: meta.accuracy,
            heading: meta.heading,
            speed: meta.speed,
            timestamp: now,
          },
          lastAcceptedGps.current,
          acceptedFixCount.current,
          pendingRecalibration.current,
        );
        pendingRecalibration.current = decision.nextPending;
        if (!decision.accept) return;
      }

      lastAcceptedGps.current = { latitude, longitude, timestamp: now };
      acceptedFixCount.current += 1;

      const nextFix: Fix = {
        latitude,
        longitude,
        heading: meta.heading,
        speed: meta.speed,
      };
      fix.current = nextFix;
      executeRef.current((repo) => repo.setDriverLocation(latitude, longitude));
      if (statusRef.current !== "granted") setStatus("granted");

      const shouldSend = shouldPushDriverLocation(
        nextFix,
        lastSentFix.current,
        lastSentAt.current,
        {
          force: forceSend,
          hasActiveOrder: activeOrderIdRef.current !== null,
          now,
        },
      );
      if (shouldSend) {
        void send().catch(() => {});
      }
    },
    [send],
  );

  const stop = useCallback(() => {
    startRunId.current += 1;
    subscription.current?.remove();
    subscription.current = null;
  }, []);

  const start = useCallback(
    async (ask: boolean) => {
      stop();
      const runId = startRunId.current;
      lastAcceptedGps.current = null;
      acceptedFixCount.current = 0;
      pendingRecalibration.current = null;
      setStatus("requesting");

      try {
        if (!(await Location.hasServicesEnabledAsync())) {
          if (startRunId.current === runId) setStatus("disabled");
          return;
        }
        const permission = ask
          ? await Location.requestForegroundPermissionsAsync()
          : await Location.getForegroundPermissionsAsync();
        if (startRunId.current !== runId) return;
        if (permission.status !== "granted") {
          setStatus(permission.canAskAgain ? "denied" : "blocked");
          return;
        }

        subscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 2_000,
            distanceInterval: 3,
          },
          (position) => {
            if (startRunId.current !== runId) return;
            applyPosition(position.coords.latitude, position.coords.longitude, {
              heading:
                position.coords.heading != null && position.coords.heading >= 0
                  ? position.coords.heading
                  : undefined,
              speed:
                position.coords.speed != null && position.coords.speed >= 0
                  ? position.coords.speed
                  : undefined,
              accuracy: position.coords.accuracy ?? undefined,
            });
          },
        );

        let initialPosition: Location.LocationObject | null = null;
        try {
          initialPosition = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
        } catch {
          initialPosition = null;
        }
        if (!initialPosition) {
          try {
            initialPosition = await Location.getLastKnownPositionAsync();
          } catch {
            initialPosition = null;
          }
        }
        if (startRunId.current === runId && initialPosition) {
          applyPosition(
            initialPosition.coords.latitude,
            initialPosition.coords.longitude,
            {
              heading:
                initialPosition.coords.heading != null &&
                initialPosition.coords.heading >= 0
                  ? initialPosition.coords.heading
                  : undefined,
              speed:
                initialPosition.coords.speed != null &&
                initialPosition.coords.speed >= 0
                  ? initialPosition.coords.speed
                  : undefined,
              accuracy: initialPosition.coords.accuracy ?? undefined,
            },
            true,
          );
        }
      } catch {
        if (startRunId.current === runId) setStatus("error");
      }
    },
    [applyPosition, stop],
  );

  // Conexión WebSocket + seguimiento GPS mientras el chofer tiene sesión activa.
  useEffect(() => {
    if (!enabled) {
      stop();
      driverSocketService.disconnect();
      fix.current = null;
      lastSentFix.current = null;
      setStatus("idle");
      return;
    }
    void driverSocketService.connect();
    void start(true);
    return () => {
      stop();
      driverSocketService.disconnect();
    };
  }, [enabled, start, stop]);

  // Reenvío periódico de la última posición real (mantiene frescura cuando el chofer está detenido).
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (fix.current) void send().catch(() => {});
    }, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [enabled, send]);

  // Al volver a la app se revisa la conexión WebSocket y el permiso GPS.
  useEffect(() => {
    if (!enabled) return;
    const listener = Lifecycle.addEventListener("change", (next) => {
      if (next !== "active") return;
      if (!driverSocketService.connected) {
        void driverSocketService.connect();
      }
      if (
        ["denied", "blocked", "disabled", "error"].includes(statusRef.current)
      ) {
        void start(false);
      } else if (fix.current) {
        void send().catch(() => {});
      }
    });
    return () => listener.remove();
  }, [enabled, start, send]);

  // Segundo plano: corre solo con la ubicación de primer plano activa y según el perfil de
  // ahorro de batería (navegación con tramo en curso, espera si está disponible, apagado si no).
  const operationalStatus = state.driver.operationalStatus;
  const hasActiveTrackedOrder = activeTrackedOrderId !== null;
  const syncBackground = useCallback(async () => {
    const profile =
      enabled && statusRef.current === "granted"
        ? backgroundProfileFor(operational.current, activeOrderIdRef.current !== null)
        : null;
    try {
      const result = await syncBackgroundTracking(profile);
      setBackground(statusRef.current === "granted" ? result : "idle");
    } catch {
      setBackground("unsupported");
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      void stopBackgroundTracking();
      setBackground("idle");
      return;
    }
    void syncBackground();
  }, [enabled, status, operationalStatus, hasActiveTrackedOrder, syncBackground]);

  // Al volver de los ajustes del teléfono se revisa si ya concedió "Permitir siempre".
  useEffect(() => {
    if (!enabled) return;
    const listener = Lifecycle.addEventListener("change", (next) => {
      if (next === "active") void syncBackground();
    });
    return () => listener.remove();
  }, [enabled, syncBackground]);

  const enableBackground = useCallback(async () => {
    const result = await requestBackgroundPermission();
    // Si el sistema ya no muestra el diálogo, el permiso se cambia en los ajustes.
    if (result === "needs_permission") await Linking.openSettings();
    await syncBackground();
  }, [syncBackground]);

  const activate = useCallback(async () => {
    if (statusRef.current === "blocked") {
      await Linking.openSettings();
      return;
    }
    await start(true);
  }, [start]);

  const reportGuayaquilDemo = useCallback(async () => {
    if (!DEMO_LOCATION_ENABLED) {
      throw Error("La ubicación de prueba solo está disponible en desarrollo.");
    }
    const { latitude, longitude } = GUAYAQUIL_DEMO_COORDS;
    fix.current = { latitude, longitude };
    lastSentFix.current = { latitude, longitude };
    executeRef.current((repo) => repo.setDriverLocation(latitude, longitude));
    setStatus("granted");
    lastSentAt.current = Date.now();
    driverSocketService.updateLocation({
      lat: latitude,
      lng: longitude,
      orderId: activeOrderIdRef.current ?? undefined,
    });
    await driverOrdersService.updateLocation({
      latitude,
      longitude,
      status: operational.current,
    });
  }, []);

  return (
    <LiveLocationContext.Provider
      value={{
        status,
        background,
        enableBackground,
        activate,
        sendStatus: (s) => send(s),
        reportGuayaquilDemo,
      }}
    >
      {children}
    </LiveLocationContext.Provider>
  );
}
