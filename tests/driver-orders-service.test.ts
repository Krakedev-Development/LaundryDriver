import { strict as assert } from "node:assert";
import { test } from "node:test";
import { driverHarness } from "./driver.fixture";
import { visibleOrders } from "../src/domain/repository";
import {
  clearAuthSession,
  saveAuthSession,
} from "../src/services/auth/authService";
import {
  driverOrdersService,
  GUAYAQUIL_COORDINATES,
  type BackendOrderDetails,
} from "../src/services/orders/driverOrdersService";

test("driverOrdersService connects route and transitions to the backend API", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];

  const fakeOrderId = "3c8f9460-7011-4eb2-a0b8-b80c0587e21a";
  const fakeDriverUserId = "usr-driver-gye";

  try {
    await clearAuthSession();
    await saveAuthSession({
      user: {
        id: fakeDriverUserId,
        email: "carlos.mendoza@laundryfresh.com",
        name: "Carlos Mendoza",
        role: "DRIVER",
        status: "ACTIVE",
        facilityId: "fac-gye-central",
        facilityName: "Planta Kennedy Norte",
      },
      tokens: {
        accessToken: "driver-access-token-123",
        refreshToken: "driver-refresh-token-123",
        expiresIn: 900,
      },
    });

    const mockOrderDetails: BackendOrderDetails = {
      id: fakeOrderId,
      number: 104,
      status: "PICKUP_ASSIGNED",
      mode: "HOME_HOME",
      facilityId: "fac-gye-central",
      paymentStatus: "PAID",
      pricingStatus: "CALCULATED",
      total: "28.50",
      version: 1,
      createdAt: "2026-11-08T10:00:00.000Z",
      items: [
        {
          id: "item-1",
          garmentId: "garment-camisas",
          serviceId: "srv-lavado",
          quantity: 5,
          unitPrice: "4.50",
          notes: "Planchado con almidón",
        },
      ],
      legs: [
        {
          id: "leg-inbound-1",
          kind: "INBOUND",
          method: "DRIVER",
          addressText: "Av. San Jorge y Kennedy Norte, Guayaquil",
          latitude: GUAYAQUIL_COORDINATES.kennedyNorte.latitude,
          longitude: GUAYAQUIL_COORDINATES.kennedyNorte.longitude,
          slot: {
            id: "slot-gye-1",
            date: "2026-11-08T00:00:00.000Z",
            startTime: "09:00",
            endTime: "11:00",
          },
          driver: {
            userId: fakeDriverUserId,
            name: "Carlos Mendoza",
          },
        },
        {
          id: "leg-outbound-1",
          kind: "OUTBOUND",
          method: "DRIVER",
          addressText: "Víctor Emilio Estrada 410, Urdesa, Guayaquil",
          latitude: GUAYAQUIL_COORDINATES.urdesa.latitude,
          longitude: GUAYAQUIL_COORDINATES.urdesa.longitude,
          slot: {
            id: "slot-gye-2",
            date: "2026-11-09T00:00:00.000Z",
            startTime: "14:00",
            endTime: "16:00",
          },
          driver: {
            userId: fakeDriverUserId,
            name: "Carlos Mendoza",
          },
        },
      ],
      events: [
        {
          id: "ev-1",
          status: "PICKUP_ASSIGNED",
          title: "Chofer asignado en Guayaquil",
          note: "Ruta asignada",
          createdAt: "2026-11-08T10:05:00.000Z",
        },
      ],
    };

    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ url, method, headers, body });

      if (url.endsWith("/orders") && method === "GET") {
        assert.equal(headers.Authorization, "Bearer driver-access-token-123");
        return new Response(
          JSON.stringify({
            page: 1,
            pageSize: 20,
            total: 1,
            data: [
              {
                id: fakeOrderId,
                number: 104,
                status: mockOrderDetails.status,
                mode: mockOrderDetails.mode,
                facilityId: mockOrderDetails.facilityId,
                paymentStatus: mockOrderDetails.paymentStatus,
                pricingStatus: mockOrderDetails.pricingStatus,
                total: mockOrderDetails.total,
                version: mockOrderDetails.version,
                createdAt: mockOrderDetails.createdAt,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith(`/orders/${fakeOrderId}`) && method === "GET") {
        assert.equal(headers.Authorization, "Bearer driver-access-token-123");
        return new Response(JSON.stringify(mockOrderDetails), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        url.endsWith(`/orders/${fakeOrderId}/transitions`) &&
        method === "POST"
      ) {
        assert.equal(headers.Authorization, "Bearer driver-access-token-123");
        const transitionBody = body as {
          to: string;
          expectedVersion: number;
          note?: string;
        };

        mockOrderDetails.status = transitionBody.to;
        mockOrderDetails.version = transitionBody.expectedVersion + 1;

        return new Response(
          JSON.stringify({
            ...mockOrderDetails,
            status: transitionBody.to,
            version: transitionBody.expectedVersion + 1,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
      });
    };

    // 1. Test getAssignedOrders
    const assignedOrders = await driverOrdersService.getAssignedOrders();
    assert.equal(assignedOrders.length, 1);
    const domainOrder = assignedOrders[0];
    assert.equal(domainOrder.id, fakeOrderId);
    assert.equal(domainOrder.status, "PICKUP_ASSIGNED");
    assert.equal(domainOrder.version, 1);
    assert.equal(
      domainOrder.fulfillmentPlan.inbound.latitude,
      GUAYAQUIL_COORDINATES.kennedyNorte.latitude,
    );
    assert.equal(
      domainOrder.fulfillmentPlan.inbound.longitude,
      GUAYAQUIL_COORDINATES.kennedyNorte.longitude,
    );

    // 2. Test getOrder
    const orderDetails = await driverOrdersService.getOrder(fakeOrderId);
    assert.equal(orderDetails.id, fakeOrderId);
    assert.equal(orderDetails.number, 104);

    // 3. Test sync into LaundryRepository
    const h = driverHarness();
    h.run((repo) => {
      repo.authenticateFromApi({
        id: fakeDriverUserId,
        email: "carlos.mendoza@laundryfresh.com",
        name: "Carlos Mendoza",
        role: "DRIVER",
        status: "ACTIVE",
        facilityId: "fac-gye-central",
        facilityName: "Planta Kennedy Norte",
      });
      repo.syncAssignedOrders(assignedOrders);
    });

    const activeOrders = visibleOrders(h.state);
    const found = activeOrders.find((o) => o.id === fakeOrderId);
    assert.ok(found);
    assert.equal(found.status, "PICKUP_ASSIGNED");

    // 4. Test confirmPickup transition: POST /orders/:id/transitions with { to: 'PICKED_UP', expectedVersion: 1 }
    const pickupResult = await driverOrdersService.confirmPickup(
      fakeOrderId,
      1,
      "5 prendas recibidas en Kennedy Norte",
    );
    assert.equal(pickupResult.status, "PICKED_UP");
    assert.equal(pickupResult.version, 2);

    h.run((repo) => {
      repo.updateOrderVersion(fakeOrderId, pickupResult.version, "PICKED_UP");
    });
    assert.equal(
      h.state.orders.find((o) => o.id === fakeOrderId)?.status,
      "PICKED_UP",
    );
    assert.equal(
      h.state.orders.find((o) => o.id === fakeOrderId)?.version,
      2,
    );

    // 5. Test confirmFacilityArrival transition: POST /orders/:id/transitions with { to: 'AT_FACILITY', expectedVersion: 2 }
    const facilityResult = await driverOrdersService.confirmFacilityArrival(
      fakeOrderId,
      2,
      "Llegada a Planta Kennedy Norte",
    );
    assert.equal(facilityResult.status, "AT_FACILITY");
    assert.equal(facilityResult.version, 3);

    h.run((repo) => {
      repo.updateOrderVersion(
        fakeOrderId,
        facilityResult.version,
        "AT_FACILITY",
      );
    });
    assert.equal(
      h.state.orders.find((o) => o.id === fakeOrderId)?.status,
      "AT_FACILITY",
    );

    // 6. Test confirmDelivery transition: POST /orders/:id/transitions with { to: 'DELIVERED', expectedVersion: 3 }
    const deliveryResult = await driverOrdersService.confirmDelivery(
      fakeOrderId,
      3,
      "Entregado a cliente en Urdesa",
    );
    assert.equal(deliveryResult.status, "DELIVERED");
    assert.equal(deliveryResult.version, 4);

    h.run((repo) => {
      repo.updateOrderVersion(fakeOrderId, deliveryResult.version, "DELIVERED");
    });
    assert.equal(
      h.state.orders.find((o) => o.id === fakeOrderId)?.status,
      "DELIVERED",
    );
    assert.equal(
      h.state.orders.find((o) => o.id === fakeOrderId)?.version,
      4,
    );

    // 7. Verify all requests recorded the correct paths and payloads
    const transitionRequests = requests.filter((r) =>
      r.url.endsWith(`/orders/${fakeOrderId}/transitions`),
    );
    assert.equal(transitionRequests.length, 3);
    assert.deepEqual(transitionRequests[0].body, {
      to: "PICKED_UP",
      expectedVersion: 1,
      note: "5 prendas recibidas en Kennedy Norte",
    });
    assert.deepEqual(transitionRequests[1].body, {
      to: "AT_FACILITY",
      expectedVersion: 2,
      note: "Llegada a Planta Kennedy Norte",
    });
    assert.deepEqual(transitionRequests[2].body, {
      to: "DELIVERED",
      expectedVersion: 3,
      note: "Entregado a cliente en Urdesa",
    });
  } finally {
    globalThis.fetch = originalFetch;
    await clearAuthSession();
  }
});
