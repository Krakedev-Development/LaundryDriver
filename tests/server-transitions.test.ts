import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";
import {
  advanceOnServer,
  CONFLICT_MESSAGE,
  OFFLINE_MESSAGE,
} from "../src/features/driver/model/serverTransitions";
import { saveAuthSession } from "../src/services/auth/authService";

// Servidor simulado: registra lo que recibe y responde según el caso.
const realFetch = globalThis.fetch;
type Call = { method: string; url: string; body: unknown };
let calls: Call[] = [];
const order = (status: string, version: number) => ({
  id: "o-1",
  status,
  version,
  mode: "HOME_HOME",
  total: "10",
  createdAt: "2026-11-16T10:00:00Z",
});
function server(respond: (call: Call) => Response | Promise<Response>) {
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
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
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

test("iniciar la recogida se registra en el servidor con la versión vista", async () => {
  await signIn();
  server(() => json(201, order("HEADING_TO_PICKUP", 4)));
  const result = await advanceOnServer(
    { id: "o-1", status: "PICKUP_ASSIGNED", version: 3 },
    "START_PICKUP",
    () => assert.fail("no debe recargar"),
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/orders\/o-1\/transitions$/);
  assert.deepEqual(calls[0].body, {
    to: "HEADING_TO_PICKUP",
    expectedVersion: 3,
    note: "Chofer en camino a recoger",
  });
  assert.equal(result.status, "HEADING_TO_PICKUP");
  assert.equal(result.version, 4);
});

test("cada avance sin código pide la transición correcta", async () => {
  await signIn();
  const cases = [
    ["ARRIVE_PICKUP", "HEADING_TO_PICKUP", "ARRIVED_FOR_PICKUP"],
    ["GO_FACILITY", "PICKED_UP", "HEADING_TO_FACILITY"],
    ["ARRIVE_DELIVERY", "OUT_FOR_DELIVERY", "ARRIVED_FOR_DELIVERY"],
  ] as const;
  for (const [action, from, to] of cases) {
    server(() => json(201, order(to, 2)));
    await advanceOnServer({ id: "o-1", status: from, version: 1 }, action, () => {});
    assert.equal((calls[0].body as { to: string }).to, to);
  }
});

test("si la versión no coincide se recarga la solicitud y se avisa, sin avanzar", async () => {
  await signIn();
  server((call) =>
    call.method === "POST"
      ? json(409, { message: "El pedido cambió; recárgalo e intenta de nuevo." })
      : json(200, order("HEADING_TO_PICKUP", 7)),
  );
  let refreshed: { status: string; version?: number } | undefined;
  await assert.rejects(
    advanceOnServer({ id: "o-1", status: "PICKUP_ASSIGNED", version: 3 }, "START_PICKUP", (latest) => {
      refreshed = latest;
    }),
    { message: CONFLICT_MESSAGE },
  );
  assert.deepEqual([refreshed?.status, refreshed?.version], ["HEADING_TO_PICKUP", 7]);
});

test("sin conexión no se avanza y se explica", async () => {
  await signIn();
  globalThis.fetch = (async () => {
    throw new TypeError("Network request failed");
  }) as typeof fetch;
  await assert.rejects(
    advanceOnServer({ id: "o-1", status: "PICKUP_ASSIGNED", version: 3 }, "START_PICKUP", () => {}),
    { message: OFFLINE_MESSAGE },
  );
});

test("una acción que no corresponde al estado no llega al servidor", async () => {
  server(() => assert.fail("no debe llamar al servidor"));
  await assert.rejects(
    advanceOnServer({ id: "o-1", status: "PICKED_UP", version: 3 }, "ARRIVE_PICKUP", () => {}),
    /no corresponde al estado actual/,
  );
  assert.equal(calls.length, 0);
});
