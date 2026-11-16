import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppState as Lifecycle, Linking } from "react-native";
import type { OperationalStatus } from "../../../domain/models";
import { driverOrdersService } from "../../../services/orders/driverOrdersService";
import { useApp } from "../../../store/AppProvider";
import {
  LiveLocationContext,
  type LocationStatus,
} from "./LiveLocationContext";

// Ubicación real del chofer. Administración la usa para decidir quién puede atender una
// solicitud y quién llega antes, así que nunca se inventa: sin GPS solo se envía el estado.

// La web descarta ubicaciones de más de 2 minutos: se reenvía la última posición cada 25 s,
// porque el teléfono deja de informar posiciones cuando el chofer está detenido.
const HEARTBEAT_MS = 25_000;
const MIN_SEND_GAP_MS = 10_000;

interface Fix {
  latitude: number;
  longitude: number;
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
  const fix = useRef<Fix | null>(null);
  const lastSentAt = useRef(0);
  const operational = useRef(state.driver.operationalStatus);
  operational.current = state.driver.operationalStatus;
  const subscription = useRef<Location.LocationSubscription | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const executeRef = useRef(execute);
  executeRef.current = execute;

  const send = useCallback(async (override?: OperationalStatus) => {
    const current = fix.current;
    const opStatus = override ?? operational.current;
    if (!current) {
      if (override)
        await driverOrdersService.updateLocation({ status: opStatus });
      return;
    }
    lastSentAt.current = Date.now();
    await driverOrdersService.updateLocation({
      latitude: current.latitude,
      longitude: current.longitude,
      status: opStatus,
    });
  }, []);

  const stop = useCallback(() => {
    subscription.current?.remove();
    subscription.current = null;
  }, []);

  const start = useCallback(
    async (ask: boolean) => {
      stop();
      setStatus("requesting");
      try {
        if (!(await Location.hasServicesEnabledAsync())) {
          setStatus("disabled");
          return;
        }
        const permission = ask
          ? await Location.requestForegroundPermissionsAsync()
          : await Location.getForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          setStatus(permission.canAskAgain ? "denied" : "blocked");
          return;
        }
        subscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15_000,
            distanceInterval: 20,
          },
          (position) => {
            const { latitude, longitude } = position.coords;
            fix.current = { latitude, longitude };
            executeRef.current((repo) =>
              repo.setDriverLocation(latitude, longitude),
            );
            if (statusRef.current !== "granted") setStatus("granted");
            if (Date.now() - lastSentAt.current >= MIN_SEND_GAP_MS)
              void send().catch(() => {});
          },
        );
      } catch {
        setStatus("error");
      }
    },
    [send, stop],
  );

  // Al iniciar sesión se pide el permiso; al cerrarla se deja de seguir la posición.
  useEffect(() => {
    if (!enabled) {
      stop();
      fix.current = null;
      setStatus("idle");
      return;
    }
    void start(true);
    return stop;
  }, [enabled, start, stop]);

  // Reenvío periódico de la última posición real.
  useEffect(() => {
    if (!enabled) return;
    const timer = setInterval(() => {
      if (fix.current) void send().catch(() => {});
    }, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [enabled, send]);

  // Al volver a la app se revisa de nuevo: el chofer pudo activar la ubicación en los ajustes.
  useEffect(() => {
    if (!enabled) return;
    const listener = Lifecycle.addEventListener("change", (next) => {
      if (next !== "active") return;
      if (
        ["denied", "blocked", "disabled", "error"].includes(statusRef.current)
      )
        void start(false);
      else if (fix.current) void send().catch(() => {});
    });
    return () => listener.remove();
  }, [enabled, start, send]);

  const activate = useCallback(async () => {
    if (statusRef.current === "blocked") {
      await Linking.openSettings();
      return;
    }
    await start(true);
  }, [start]);

  return (
    <LiveLocationContext.Provider
      value={{ status, activate, sendStatus: (s) => send(s) }}
    >
      {children}
    </LiveLocationContext.Provider>
  );
}
