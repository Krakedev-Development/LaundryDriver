import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateDriverGpsFix,
  shouldPushDriverLocation,
} from "../src/features/driver/model/gpsFilter";

test("evaluateDriverGpsFix accepts valid first fix and rejects noisy or teleport jumps", () => {
  const t0 = 1_700_000_000_000;
  const first = evaluateDriverGpsFix(
    { latitude: -2.1894, longitude: -79.8891, accuracy: 12, timestamp: t0 },
    null,
    0,
    null,
  );
  assert.equal(first.accept, true);

  // Noisy accuracy (>25m within fresh window) is rejected
  const noisy = evaluateDriverGpsFix(
    { latitude: -2.1895, longitude: -79.8892, accuracy: 60, timestamp: t0 + 2000 },
    { latitude: -2.1894, longitude: -79.8891, timestamp: t0 },
    2,
    null,
  );
  assert.equal(noisy.accept, false);

  // Plausible city movement (~15m in 2s = 7.5 m/s) is accepted
  const plausible = evaluateDriverGpsFix(
    { latitude: -2.18927, longitude: -79.8891, accuracy: 10, timestamp: t0 + 2000 },
    { latitude: -2.1894, longitude: -79.8891, timestamp: t0 },
    2,
    null,
  );
  assert.equal(plausible.accept, true);

  // Impossible teleport (>1km in 2s) is rejected
  const teleport = evaluateDriverGpsFix(
    { latitude: -2.17, longitude: -79.8891, accuracy: 10, timestamp: t0 + 2000 },
    { latitude: -2.1894, longitude: -79.8891, timestamp: t0 },
    5,
    null,
  );
  assert.equal(teleport.accept, false);
});

test("shouldPushDriverLocation throttles idle drivers and accelerates when order is active", () => {
  const origin = { latitude: -2.1894, longitude: -79.8891 };
  const moved10m = { latitude: -2.18931, longitude: -79.8891 };
  const t0 = 1_700_000_000_000;

  assert.equal(
    shouldPushDriverLocation(moved10m, origin, t0, {
      hasActiveOrder: true,
      now: t0 + 3000,
    }),
    true,
  );
  assert.equal(
    shouldPushDriverLocation(moved10m, origin, t0, {
      hasActiveOrder: false,
      now: t0 + 3000,
    }),
    false,
  );
});
