import { strict as assert } from "node:assert";
import { test } from "node:test";
import { driverHarness } from "./driver.fixture";
import { visibleOrders } from "../src/domain/repository";
import {
  buildGoogleMapsDirectionsUrl,
  buildWazeDirectionsUrl,
  GUAYAQUIL_FALLBACK,
  resolveOrderNavigationTarget,
} from "../src/services/navigation/externalMapsUrls";

test("buildGoogleMapsDirectionsUrl and buildWazeDirectionsUrl format exact coordinates", () => {
  const latitude = -2.158;
  const longitude = -79.896;

  assert.equal(
    buildGoogleMapsDirectionsUrl(latitude, longitude),
    "https://www.google.com/maps/dir/?api=1&destination=-2.158,-79.896&travelmode=driving",
  );

  assert.equal(
    buildWazeDirectionsUrl(latitude, longitude),
    "https://waze.com/ul?ll=-2.158,-79.896&navigate=yes",
  );
});

test("resolveOrderNavigationTarget uses active pickup or delivery leg coordinates", () => {
  const h = driverHarness();
  h.signIn();
  const baseOrder = visibleOrders(h.state)[0];
  assert.ok(baseOrder);

  const pickupOrder = {
    ...baseOrder,
    status: "PICKUP_ASSIGNED" as const,
    fulfillmentPlan: {
      ...baseOrder.fulfillmentPlan,
      inbound: {
        ...baseOrder.fulfillmentPlan.inbound,
        latitude: -2.158,
        longitude: -79.896,
      },
      outbound: {
        ...baseOrder.fulfillmentPlan.outbound,
        latitude: -2.17,
        longitude: -79.912,
      },
    },
  };

  const pickupTarget = resolveOrderNavigationTarget(pickupOrder);
  assert.equal(pickupTarget.isPickup, true);
  assert.equal(pickupTarget.stopKind, "PICKUP");
  assert.equal(pickupTarget.latitude, -2.158);
  assert.equal(pickupTarget.longitude, -79.896);

  const deliveryOrder = {
    ...pickupOrder,
    status: "OUT_FOR_DELIVERY" as const,
  };

  const deliveryTarget = resolveOrderNavigationTarget(deliveryOrder);
  assert.equal(deliveryTarget.isPickup, false);
  assert.equal(deliveryTarget.stopKind, "DELIVERY");
  assert.equal(deliveryTarget.latitude, -2.17);
  assert.equal(deliveryTarget.longitude, -79.912);

  const missingCoordsOrder = {
    ...pickupOrder,
    fulfillmentPlan: {
      ...pickupOrder.fulfillmentPlan,
      inbound: {
        ...pickupOrder.fulfillmentPlan.inbound,
        latitude: 0,
        longitude: 0,
      },
    },
  };

  const fallbackTarget = resolveOrderNavigationTarget(missingCoordsOrder);
  assert.equal(fallbackTarget.latitude, GUAYAQUIL_FALLBACK.latitude);
  assert.equal(fallbackTarget.longitude, GUAYAQUIL_FALLBACK.longitude);
});
