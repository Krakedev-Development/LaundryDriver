import { strict as assert } from "node:assert";
import { test } from "node:test";
import type { Order } from "../src/domain/models";
import { driverHarness } from "./driver.fixture";

// Un pedido del servidor (id UUID) tomando como base uno del estado de prueba.
function serverOrder(base: Order, id: string, version: number, status: Order["status"]): Order {
  return { ...base, id, version, status };
}

const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";

test("una lista más vieja no pisa la versión más nueva que trajo el aviso del socket", () => {
  const h = driverHarness();
  h.signIn();
  const base = h.state.orders[0];
  h.run((repo) => repo.syncAssignedOrders([serverOrder(base, ID_A, 5, "DELIVERY_ASSIGNED")]));
  h.run((repo) => repo.syncAssignedOrders([serverOrder(base, ID_A, 4, "READY_FOR_DELIVERY")]));
  const order = h.state.orders.find((o) => o.id === ID_A)!;
  assert.equal(order.version, 5);
  assert.equal(order.status, "DELIVERY_ASSIGNED");

  // Una versión igual o mayor sí se aplica.
  h.run((repo) => repo.syncAssignedOrders([serverOrder(base, ID_A, 6, "OUT_FOR_DELIVERY")]));
  assert.equal(h.state.orders.find((o) => o.id === ID_A)!.status, "OUT_FOR_DELIVERY");
});

test("una lista pedida antes de una asignación nueva no quita ese pedido", () => {
  const h = driverHarness();
  h.signIn();
  const base = h.state.orders[0];
  h.run((repo) => repo.syncAssignedOrders([serverOrder(base, ID_A, 1, "PICKUP_ASSIGNED")]));
  const fetchedAt = Date.now() - 1_000; // La lista se pidió antes de que llegara el aviso.
  h.run((repo) => repo.syncAssignedOrders([serverOrder(base, ID_B, 1, "PICKUP_ASSIGNED")]));
  h.run((repo) => repo.pruneUnassignedOrders([ID_A], fetchedAt));
  assert.ok(h.state.orders.some((o) => o.id === ID_B));

  // Una lista pedida después sí lo quita si el servidor ya no lo trae (lo liberaron).
  h.run((repo) => repo.pruneUnassignedOrders([ID_A], Date.now() + 1_000));
  assert.ok(!h.state.orders.some((o) => o.id === ID_B));
});
