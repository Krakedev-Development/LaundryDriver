import { strict as assert } from "node:assert";
import { test } from "node:test";
import { refreshOrderFromServer } from "../src/features/driver/model/orderStatusRefresh";
import { ApiError } from "../src/services/api/apiClient";
import type { BackendOrderDetails } from "../src/services/orders/driverOrdersService";
import { driverHarness } from "./driver.fixture";

const SERVER_ID = "5b7c1f0e-3a2d-4c8b-9e61-0f2a4d6c8e10";
const OTHER_SERVER_ID = "6c8d2a1f-4b3e-4d9c-8f72-1a3b5c7d9e21";

function serverOrder(id: string, status: string): BackendOrderDetails {
  return {
    id, number: 9100, status, mode: "HOME_HOME", facilityId: "f1",
    paymentStatus: "PAID", pricingStatus: "FINAL", total: "20.00", version: 5,
    createdAt: "2026-11-20T12:00:00.000Z",
  } as unknown as BackendOrderDetails;
}

test("un aviso de cancelación actualiza el pedido con lo que devuelve el servidor", async () => {
  const updated: string[] = [];
  const result = await refreshOrderFromServer(SERVER_ID, {
    getOrder: async (id) => serverOrder(id, "CANCELLED"),
    onUpdate: (order) => updated.push(`${order.id}:${order.status}`),
    onRemove: () => assert.fail("no debe quitarse"),
  });
  assert.equal(result, "updated");
  assert.deepEqual(updated, [`${SERVER_ID}:CANCELLED`]);
});

test("si el servidor ya no le muestra el pedido (lo liberaron), se quita de su lista", async () => {
  for (const status of [404, 403]) {
    const removed: string[] = [];
    const result = await refreshOrderFromServer(SERVER_ID, {
      getOrder: async () => {
        throw new ApiError("El pedido no existe.", status);
      },
      onUpdate: () => assert.fail("no debe actualizarse"),
      onRemove: (id) => removed.push(id),
    });
    assert.equal(result, "removed");
    assert.deepEqual(removed, [SERVER_ID]);
  }
});

test("sin conexión se conserva lo último conocido", async () => {
  const result = await refreshOrderFromServer(SERVER_ID, {
    getOrder: async () => {
      throw new ApiError("Sin conexión", 0);
    },
    onUpdate: () => assert.fail("no debe actualizarse"),
    onRemove: () => assert.fail("no debe quitarse"),
  });
  assert.equal(result, "kept");
});

test("al recargar la lista se quitan los pedidos del servidor que ya no son del chofer", () => {
  const h = driverHarness();
  h.signIn();
  const demoIds = h.state.orders.map((o) => o.id);
  const base = h.state.orders[0]!;
  h.run((repo) =>
    repo.syncAssignedOrders([
      { ...base, id: SERVER_ID, status: "PICKUP_ASSIGNED" },
      { ...base, id: OTHER_SERVER_ID, status: "PICKUP_ASSIGNED" },
    ]),
  );
  // El servidor solo devuelve uno: el otro fue liberado.
  h.run((repo) => repo.pruneUnassignedOrders([SERVER_ID]));
  const ids = h.state.orders.map((o) => o.id);
  assert.ok(ids.includes(SERVER_ID));
  assert.ok(!ids.includes(OTHER_SERVER_ID));
  // Los pedidos de prueba (sin id del servidor) no se tocan.
  for (const id of demoIds) assert.ok(ids.includes(id));

  h.run((repo) => repo.removeOrder(SERVER_ID));
  assert.ok(!h.state.orders.some((o) => o.id === SERVER_ID));
});
