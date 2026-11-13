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
  type BackendOrderDetails,
} from "../src/services/orders/driverOrdersService";

const KENNEDY_NORTE = { latitude: -2.158, longitude: -79.896 };
const URDESA = { latitude: -2.17, longitude: -79.912 };

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
          latitude: KENNEDY_NORTE.latitude,
          longitude: KENNEDY_NORTE.longitude,
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
          latitude: URDESA.latitude,
          longitude: URDESA.longitude,
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
      KENNEDY_NORTE.latitude,
    );
    assert.equal(
      domainOrder.fulfillmentPlan.inbound.longitude,
      KENNEDY_NORTE.longitude,
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

test("driverOrdersService reports live location and status to PATCH /drivers/me/location", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];

  try {
    await clearAuthSession();
    await saveAuthSession({
      user: {
        id: "driver-gye-1",
        email: "carlos.mendoza@laundryfresh.com",
        name: "Carlos Mendoza",
        role: "DRIVER",
        status: "ACTIVE",
        facilityId: "fac-gye-central",
        facilityName: "Planta Kennedy Norte",
      },
      tokens: {
        accessToken: "driver-token-abc",
        refreshToken: "driver-refresh-abc",
        expiresIn: 900,
      },
    });

    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ url, method, headers, body });

      if (url.endsWith("/drivers/me/location") && method === "PATCH") {
        assert.equal(headers.Authorization, "Bearer driver-token-abc");
        return new Response(
          JSON.stringify({
            id: "drv-record-1",
            userId: "driver-gye-1",
            facilityId: "fac-gye-central",
            vehicle: "Camioneta 1",
            plate: "GYE-1234",
            latitude: (body as { latitude: number }).latitude,
            longitude: (body as { longitude: number }).longitude,
            locationAt: "2026-11-11T19:30:00.000Z",
            status: (body as { status?: string }).status ?? "AVAILABLE",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
      });
    };

    const telemetry = await driverOrdersService.updateLocation({
      latitude: -2.1894,
      longitude: -79.8891,
      status: "ON_SERVICE",
    });

    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "PATCH");
    assert.ok(requests[0].url.endsWith("/drivers/me/location"));
    assert.deepEqual(requests[0].body, {
      latitude: -2.1894,
      longitude: -79.8891,
      status: "ON_SERVICE",
    });
    assert.equal(telemetry.status, "ON_SERVICE");
    assert.equal(telemetry.latitude, -2.1894);
    assert.equal(telemetry.longitude, -79.8891);
  } finally {
    globalThis.fetch = originalFetch;
    await clearAuthSession();
  }
});
