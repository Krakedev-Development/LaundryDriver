import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { authenticateSession } from "@laundry/mobile-auth";
import { driverHarness } from "./driver.fixture";
import { DEMO_PASSWORD_HASH } from "../src/domain/seed";
import { visibleOrders } from "../src/domain/repository";
import {
  authService,
  clearAuthSession,
  DRIVER_ONLY_ERROR_MESSAGE,
  getStoredAuthSession,
} from "../src/services/auth/authService";
import {
  decodeState,
  STORAGE_KEY,
  PersistenceQueue,
} from "../src/store/persistence";

test("driver app accepts only provisioned driver credentials and exposes no registration", () => {
  const h = driverHarness();
  assert.equal(h.state.session, null);
  assert.ok(h.state.accounts.every((account) => account.role === "DRIVER"));
  assert.ok(
    h.state.customers.every(
      (customer) =>
        !("walletBalance" in customer) && !("kycStatus" in customer),
    ),
  );
  h.run((repo) =>
    repo.login(" CARLOS.MENDOZA@LAUNDRYFRESH.COM ", DEMO_PASSWORD_HASH),
  );
  assert.equal(decodeState(JSON.stringify(h.state)).session?.role, "DRIVER");
  assert.throws(() =>
    h.run((repo) => repo.login("maria.torres@gmail.com", DEMO_PASSWORD_HASH)),
  );
  assert.throws(
    () => h.run((repo) => repo.demoLogin("CLIENT")),
    new RegExp(DRIVER_ONLY_ERROR_MESSAGE),
  );
  h.run((repo) =>
    assert.equal(
      "register" in repo || "createOrder" in repo || "addWalletCredit" in repo,
      false,
    ),
  );
  assert.throws(() =>
    authenticateSession(
      h.state.accounts,
      h.state.driver.email,
      DEMO_PASSWORD_HASH,
      "CLIENT",
    ),
  );
});

test("temporary password blocks services and its mandatory change persists", () => {
  const h = driverHarness();
  h.run((repo) => repo.simulateTemporaryPassword());
  assert.throws(
    () => h.run((repo) => repo.driverAction("SOL-4587", "ARRIVE_PICKUP")),
    /temporal/,
  );
  const hash = createHash("sha256").update("Segura123").digest("hex");
  h.run((repo) => repo.changePassword("", hash, true));
  h.run((repo) => repo.logout());
  h.run((repo) => repo.login(h.state.driver.email, hash));
  assert.equal(
    decodeState(JSON.stringify(h.state)).driver.mustChangePassword,
    false,
  );
});

test("driver chat preserves sender identity and storage uses its own namespace", async () => {
  const h = driverHarness();
  h.run((repo) => repo.demoLogin("DRIVER"));
  h.run((repo) => repo.sendChatMessage("SOL-4587", "Estoy en camino."));
  assert.equal(h.state.chatMessages["SOL-4587"].at(-1)?.senderRole, "DRIVER");
  const values = new Map<string, string>();
  const queue = new PersistenceQueue({
    getItem: async (key) => values.get(key) ?? null,
    setItem: async (key, value) => {
      values.set(key, value);
    },
  });
  await queue.save(h.state);
  assert.ok(values.has(STORAGE_KEY));
  assert.ok(!values.has("laundry.native-migration.v1"));
  assert.equal(
    (await queue.load())!.chatMessages["SOL-4587"].at(-1)?.text,
    "Estoy en camino.",
  );
});

test("API login enforces DRIVER role and handles PASSWORD_CHANGE_REQUIRED flow", async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body: unknown;
  }> = [];

  try {
    await clearAuthSession();

    globalThis.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input.toString();
      const method = init?.method ?? "GET";
      const headers = (init?.headers ?? {}) as Record<string, string>;
      const body = init?.body ? JSON.parse(String(init.body)) : undefined;
      requests.push({ url, method, headers, body });

      if (url.endsWith("/auth/login") && method === "POST") {
        const { email } = body as { email: string; password: string };
        if (email === "cliente@laundry.local") {
          return new Response(
            JSON.stringify({
              user: {
                id: "usr-client-1",
                email,
                name: "Cliente Uno",
                role: "CLIENT",
                status: "ACTIVE",
                facilityId: null,
              },
              tokens: {
                accessToken: "client-access",
                refreshToken: "client-refresh",
                expiresIn: 900,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (email === "admin@laundry.local") {
          return new Response(
            JSON.stringify({
              user: {
                id: "usr-admin-1",
                email,
                name: "Admin Uno",
                role: "ADMIN",
                status: "ACTIVE",
                facilityId: null,
              },
              tokens: {
                accessToken: "admin-access",
                refreshToken: "admin-refresh",
                expiresIn: 900,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            user: {
              id: "usr-driver-api",
              email,
              name: "Mateo Vera",
              role: "DRIVER",
              status: "PASSWORD_CHANGE_REQUIRED",
              facilityId: "fac-gye-norte",
            },
            tokens: {
              accessToken: "temp-driver-access",
              refreshToken: "temp-driver-refresh",
              expiresIn: 900,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/auth/logout") && method === "POST") {
        return new Response(JSON.stringify({ revoked: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (url.endsWith("/auth/change-password") && method === "POST") {
        assert.equal(headers.Authorization, "Bearer temp-driver-access");
        assert.deepEqual(body, {
          currentPassword: "TempPassword123",
          newPassword: "NuevaPassword123",
        });
        return new Response(
          JSON.stringify({
            accessToken: "active-driver-access",
            refreshToken: "active-driver-refresh",
            expiresIn: 900,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/auth/me") && method === "GET") {
        assert.equal(headers.Authorization, "Bearer active-driver-access");
        return new Response(
          JSON.stringify({
            id: "usr-driver-api",
            email: "mateo.vera@laundry.local",
            name: "Mateo Vera",
            role: "DRIVER",
            status: "ACTIVE",
            facilityId: "fac-gye-norte",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      if (url.endsWith("/facilities/fac-gye-norte") && method === "GET") {
        return new Response(
          JSON.stringify({
            id: "fac-gye-norte",
            name: "Planta Kennedy Norte",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(JSON.stringify({ message: "Not Found" }), {
        status: 404,
      });
    };

    await assert.rejects(
      () =>
        authService.login({
          email: "cliente@laundry.local",
          password: "Password1234",
        }),
      (err: Error) => err.message === DRIVER_ONLY_ERROR_MESSAGE,
    );

    await assert.rejects(
      () =>
        authService.login({
          email: "admin@laundry.local",
          password: "Password1234",
        }),
      (err: Error) => err.message === DRIVER_ONLY_ERROR_MESSAGE,
    );

    const h = driverHarness();
    const loginRes = await authService.login({
      email: "Mateo.Vera@laundry.local",
      password: "TempPassword123",
    });
    const tempHash = createHash("sha256")
      .update("TempPassword123")
      .digest("hex");

    h.run((repo) => repo.login(loginRes.user.email, tempHash, loginRes.user));

    assert.equal(h.state.session?.id, "usr-driver-api");
    assert.equal(h.state.driver.id, "usr-driver-api");
    assert.equal(h.state.driver.name, "Mateo Vera");
    assert.equal(h.state.driver.email, "mateo.vera@laundry.local");
    assert.equal(h.state.driver.mustChangePassword, true);
    assert.equal(visibleOrders(h.state).length, 6);

    const changeRes = await authService.changePassword({
      newPassword: "NuevaPassword123",
    });
    const newHash = createHash("sha256")
      .update("NuevaPassword123")
      .digest("hex");

    h.run((repo) => repo.changePassword("", newHash, true, changeRes.user));

    assert.equal(h.state.driver.mustChangePassword, false);
    assert.equal(h.state.driver.facilityName, "Planta Kennedy Norte");
    assert.equal(
      decodeState(JSON.stringify(h.state)).driver.mustChangePassword,
      false,
    );

    const stored = await getStoredAuthSession();
    assert.equal(stored.accessToken, "active-driver-access");
    assert.equal(stored.tempPassword, null);
    assert.equal(stored.user?.status, "ACTIVE");
  } finally {
    globalThis.fetch = originalFetch;
    await clearAuthSession();
  }
});
