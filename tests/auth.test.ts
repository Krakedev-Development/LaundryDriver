import { strict as assert } from "node:assert";
import { createHash } from "node:crypto";
import { test } from "node:test";
import { authenticateSession } from "@laundry/mobile-auth";
import { driverHarness } from "./driver.fixture";
import { DEMO_PASSWORD_HASH } from "../src/domain/seed";
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
  assert.throws(() => h.run((repo) => repo.demoLogin("CLIENT")));
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
