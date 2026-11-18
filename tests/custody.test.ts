import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";
import {
  CODE_REQUIRED_MESSAGE,
  NO_CODE_MESSAGE,
  parseCustodyInput,
  verifyCustody,
  WRONG_ORDER_MESSAGE,
} from "../src/features/driver/model/custody";
import { CONFLICT_MESSAGE, OFFLINE_MESSAGE } from "../src/features/driver/model/serverTransitions";
import { saveAuthSession } from "../src/services/auth/authService";

const ORDER = "9d0a8700-d1c1-4f74-b2ef-73db0e9fd844";
const TOKEN = "AbCdEfGhIjKlMnOpQrStUvWxYz012345";
const qr = (order = ORDER, type = "CUSTOMER_TO_DRIVER") => `LDH1:${order}:${type}:${TOKEN}`;

test("el código de 6 dígitos y el QR de esta solicitud se reconocen", () => {
  assert.deepEqual(parseCustodyInput(" 482910 ", ORDER, "CUSTOMER_TO_DRIVER"), { code: "482910" });
  assert.deepEqual(parseCustodyInput(qr(), ORDER, "CUSTOMER_TO_DRIVER"), { qrToken: TOKEN });
});

test("un QR de otra solicitud u otra etapa, o un texto inválido, se rechazan sin llamar al servidor", () => {
  assert.throws(() => parseCustodyInput(qr("otra"), ORDER, "CUSTOMER_TO_DRIVER"), { message: WRONG_ORDER_MESSAGE });
  assert.throws(() => parseCustodyInput(qr(ORDER, "DRIVER_TO_CUSTOMER"), ORDER, "CUSTOMER_TO_DRIVER"), /etapa/);
  for (const bad of ["", "12345", "1234567", "abc123", "LDH1:roto"])
    assert.throws(() => parseCustodyInput(bad, ORDER, "CUSTOMER_TO_DRIVER"), { message: CODE_REQUIRED_MESSAGE });
});

// ---- Validación en el servidor

const realFetch = globalThis.fetch;
type Call = { method: string; url: string; body: unknown };
let calls: Call[] = [];
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
function server(respond: (call: Call) => Response) {
  calls = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const call = {
      method: init?.method ?? "GET",
      url: String(url),
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    };
    calls.push(call);
    return respond(call);
  }) as typeof fetch;
}
const order = (status: string, version: number) => ({
  id: ORDER, status, version, mode: "HOME_HOME", total: "10", createdAt: "2026-11-17T10:00:00Z",
});
afterEach(() => {
  globalThis.fetch = realFetch;
});
async function signIn() {
  await saveAuthSession({
    user: { id: "u-1", email: "c@x.ec", name: "Chofer", role: "DRIVER", status: "ACTIVE" } as never,
    tokens: { accessToken: "tok", refreshToken: "ref", expiresIn: 900 } as never,
  });
}

test("la recogida se valida con el código, la versión vista y las prendas declaradas", async () => {
  await signIn();
  server(() => json(201, order("PICKED_UP", 6)));
  const result = await verifyCustody(
    { id: ORDER, version: 5 },
    "CUSTOMER_TO_DRIVER",
    { code: "482910" },
    { declaredCount: 7, notes: "Bolsa azul" },
    () => assert.fail("no debe recargar"),
  );
  assert.match(calls[0].url, new RegExp(`/orders/${ORDER}/handoffs/verify$`));
  assert.deepEqual(calls[0].body, {
    type: "CUSTOMER_TO_DRIVER",
    expectedVersion: 5,
    declaredCount: 7,
    notes: "Bolsa azul",
    code: "482910",
  });
  assert.deepEqual([result.status, result.version], ["PICKED_UP", 6]);
});

test("con QR se envía el token del QR en lugar del código", async () => {
  await signIn();
  server(() => json(201, order("PICKED_UP", 6)));
  await verifyCustody({ id: ORDER, version: 5 }, "CUSTOMER_TO_DRIVER", { qrToken: TOKEN }, { declaredCount: 2 }, () => {});
  const body = calls[0].body as Record<string, unknown>;
  assert.equal(body.qrToken, TOKEN);
  assert.equal("code" in body, false);
});

test("los mensajes del servidor sobre el código se muestran tal cual", async () => {
  await signIn();
  for (const [status, message] of [
    [422, "Código incorrecto. Intentos restantes: 2."],
    [410, "El código venció; solicita uno nuevo."],
    [423, "El código está bloqueado por demasiados intentos."],
  ] as const) {
    server(() => json(status, { message }));
    await assert.rejects(
      verifyCustody({ id: ORDER, version: 5 }, "CUSTOMER_TO_DRIVER", { code: "111111" }, { declaredCount: 1 }, () => {}),
      { message },
    );
  }
});

test("si el cliente no generó su código se le explica al chofer qué pedir", async () => {
  await signIn();
  server(() => json(409, { message: "No hay un código vigente para este traspaso." }));
  await assert.rejects(
    verifyCustody({ id: ORDER, version: 5 }, "CUSTOMER_TO_DRIVER", { code: "111111" }, { declaredCount: 1 }, () => {}),
    { message: NO_CODE_MESSAGE },
  );
});

test("si la versión cambió se recarga la solicitud y se avisa", async () => {
  await signIn();
  server((call) =>
    call.method === "POST"
      ? json(409, { message: "El pedido cambió (versión 7); recárgalo e intenta de nuevo." })
      : json(200, order("ARRIVED_FOR_PICKUP", 7)),
  );
  let refreshed: number | undefined;
  await assert.rejects(
    verifyCustody({ id: ORDER, version: 5 }, "CUSTOMER_TO_DRIVER", { code: "111111" }, { declaredCount: 1 }, (latest) => {
      refreshed = latest.version;
    }),
    { message: CONFLICT_MESSAGE },
  );
  assert.equal(refreshed, 7);
});

test("sin conexión no se registra la recogida", async () => {
  await signIn();
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;
  await assert.rejects(
    verifyCustody({ id: ORDER, version: 5 }, "CUSTOMER_TO_DRIVER", { code: "111111" }, { declaredCount: 1 }, () => {}),
    { message: OFFLINE_MESSAGE },
  );
});

// ---- Recogida fallida
import { failedPickupReason, reportFailedPickup } from "../src/features/driver/model/custody";

test("el motivo de la recogida fallida es obligatorio y 'Otro' exige detalle", () => {
  assert.equal(failedPickupReason("Cliente ausente", ""), "Cliente ausente");
  assert.equal(failedPickupReason("Cliente ausente", " Tocó 3 veces "), "Cliente ausente: Tocó 3 veces");
  assert.equal(failedPickupReason("Otro", "Edificio cerrado"), "Edificio cerrado");
  assert.throws(() => failedPickupReason("", ""), /Elige el motivo/);
  assert.throws(() => failedPickupReason("Otro", "  "), /Describe qué pasó/);
  assert.throws(() => failedPickupReason("Otro", "x".repeat(301)), /300 caracteres/);
});

test("reportar la recogida fallida envía el motivo y la versión vista", async () => {
  await signIn();
  server(() => json(201, order("INCIDENT", 6)));
  const result = await reportFailedPickup({ id: ORDER, version: 5 }, "Cliente ausente", () => {});
  assert.match(calls[0].url, new RegExp(`/orders/${ORDER}/failed-pickup$`));
  assert.deepEqual(calls[0].body, { expectedVersion: 5, reason: "Cliente ausente" });
  assert.equal(result.status, "INCIDENT");
});

test("sin conexión la recogida fallida no se reporta", async () => {
  await signIn();
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;
  await assert.rejects(reportFailedPickup({ id: ORDER, version: 5 }, "Cliente ausente", () => {}), {
    message: OFFLINE_MESSAGE,
  });
});
