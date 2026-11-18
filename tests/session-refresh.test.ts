import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";
import {
  ApiError,
  apiClient,
  onSessionExpired,
  SESSION_EXPIRED_MESSAGE,
  setSessionRefresher,
} from "../src/services/api/apiClient";

// Servidor simulado: acepta solo el token "nuevo"; registra los tokens recibidos.
const realFetch = globalThis.fetch;
let seen: (string | null)[] = [];
function server(validToken = "nuevo") {
  seen = [];
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const auth = (init?.headers as Record<string, string>)?.Authorization ?? null;
    seen.push(auth);
    const ok = auth === `Bearer ${validToken}`;
    return new Response(JSON.stringify(ok ? { ok: true } : { message: "Unauthorized" }), {
      status: ok ? 200 : 401,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = realFetch;
  setSessionRefresher(null);
});

test("si la sesión venció, se renueva una vez y se repite el pedido", async () => {
  server();
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    return "nuevo";
  });
  const res = await apiClient.patch("/drivers/me/location", { latitude: 1 }, { accessToken: "viejo" });
  assert.deepEqual(res, { ok: true });
  assert.deepEqual(seen, ["Bearer viejo", "Bearer nuevo"]);
  assert.equal(renewals, 1);
});

test("varios pedidos vencidos a la vez comparten una sola renovación", async () => {
  server();
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    await new Promise((r) => setTimeout(r, 10));
    return "nuevo";
  });
  await Promise.all([
    apiClient.get("/drivers/me", { accessToken: "viejo" }),
    apiClient.get("/orders", { accessToken: "viejo" }),
    apiClient.patch("/drivers/me/location", {}, { accessToken: "viejo" }),
  ]);
  assert.equal(renewals, 1);
});

test("si el servidor rechaza la renovación, se avisa que la sesión expiró", async () => {
  server();
  setSessionRefresher(async () => null);
  let expired = 0;
  const stop = onSessionExpired(() => expired++);
  await assert.rejects(
    apiClient.get("/drivers/me", { accessToken: "viejo" }),
    (e: unknown) => e instanceof ApiError && e.statusCode === 401 && e.message === SESSION_EXPIRED_MESSAGE,
  );
  assert.equal(expired, 1);
  stop();
});

test("sin conexión durante la renovación no se da la sesión por vencida", async () => {
  server();
  setSessionRefresher(async () => {
    throw new ApiError("No se pudo conectar con el servidor.", 0);
  });
  let expired = 0;
  const stop = onSessionExpired(() => expired++);
  await assert.rejects(
    apiClient.get("/drivers/me", { accessToken: "viejo" }),
    (e: unknown) => e instanceof ApiError && e.statusCode === 0,
  );
  assert.equal(expired, 0);
  stop();
});

test("no se intenta renovar en las rutas de autenticación ni sin token", async () => {
  server();
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    return "nuevo";
  });
  await assert.rejects(apiClient.post("/auth/login", {}, { accessToken: "viejo" }));
  await assert.rejects(apiClient.get("/drivers/me"));
  assert.equal(renewals, 0);
});

test("si el pedido repetido también falla, no se renueva en bucle", async () => {
  server("otro");
  let renewals = 0;
  setSessionRefresher(async () => {
    renewals++;
    return "nuevo";
  });
  await assert.rejects(
    apiClient.get("/drivers/me", { accessToken: "viejo" }),
    (e: unknown) => e instanceof ApiError && e.statusCode === 401,
  );
  assert.equal(renewals, 1);
  assert.equal(seen.length, 2);
});
