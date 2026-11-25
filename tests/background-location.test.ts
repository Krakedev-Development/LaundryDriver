import assert from "node:assert/strict";
import { test } from "node:test";
import {
  BACKGROUND_PROFILES,
  MAX_BACKGROUND_ACCURACY_METERS,
  backgroundProfileFor,
  shouldSendBackgroundFix,
} from "../src/features/driver/model/backgroundLocationPolicy";

test("el perfil de segundo plano ahorra batería según el estado del chofer", () => {
  // Con un tramo en curso el cliente lo ve en el mapa: perfil de navegación.
  assert.equal(backgroundProfileFor("ON_SERVICE", true)?.name, "navigation");
  assert.equal(backgroundProfileFor("AVAILABLE", true)?.name, "navigation");
  // Sin tramo, solo lo necesario para el mapa de flota y la alerta de inactividad.
  assert.equal(backgroundProfileFor("AVAILABLE", false)?.name, "standby");
  assert.equal(backgroundProfileFor("ON_SERVICE", false)?.name, "standby");
  // En pausa o desconectado el GPS de fondo se apaga.
  assert.equal(backgroundProfileFor("BREAK", false), null);
  assert.equal(backgroundProfileFor("OFFLINE", false), null);

  const { navigation, standby } = BACKGROUND_PROFILES;
  assert.ok(navigation.highAccuracy && !standby.highAccuracy);
  assert.ok(standby.timeIntervalMs > navigation.timeIntervalMs);
  assert.ok(standby.minSendIntervalMs > navigation.minSendIntervalMs);
});

test("en segundo plano se envían lecturas útiles, sin duplicar el seguimiento de primer plano", () => {
  const now = 1_700_000_000_000;
  const base = { appActive: false, lastSentAt: now - 10_000, minSendIntervalMs: 4_000, now };
  const fix = { accuracy: 15, timestamp: now - 1_000 };

  assert.equal(shouldSendBackgroundFix(fix, base), true);
  // Con la app abierta ya envía watchPositionAsync.
  assert.equal(shouldSendBackgroundFix(fix, { ...base, appActive: true }), false);
  // Respeta el intervalo mínimo del perfil.
  assert.equal(shouldSendBackgroundFix(fix, { ...base, lastSentAt: now - 2_000 }), false);
  // Descarta lecturas imprecisas y lecturas viejas entregadas en lote.
  assert.equal(
    shouldSendBackgroundFix({ ...fix, accuracy: MAX_BACKGROUND_ACCURACY_METERS + 1 }, base),
    false,
  );
  assert.equal(shouldSendBackgroundFix({ ...fix, timestamp: now - 61_000 }, base), false);
  // Sin precisión informada se acepta (algunos equipos no la reportan).
  assert.equal(shouldSendBackgroundFix({ accuracy: null, timestamp: now }, base), true);
});
