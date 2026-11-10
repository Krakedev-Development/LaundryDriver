// Fixture de Playwright: la aplicación arranca vacía, así que estas pruebas siembran un
// chofer con servicios de prueba (tests/fixtures/seedState.ts). La API no está disponible.
const fs = require("node:fs");
const path = require("node:path");
const base = require("@playwright/test");

const STATE_KEY = "laundry.driver-mvp.v2";
const SEED = path.join(__dirname, "../fixtures/generated/seed-state.json");

exports.expect = base.expect;
exports.STATE_KEY = STATE_KEY;
exports.test = base.test.extend({
  seeded: [true, { option: true }],
  context: async ({ context, seeded }, use) => {
    await context.route("**/api/v1/**", (route) => route.abort());
    if (seeded) {
      if (!fs.existsSync(SEED))
        throw new Error("Falta el estado de prueba: ejecuta pnpm test:ui.");
      const raw = fs.readFileSync(SEED, "utf8");
      // Tras localStorage.clear() la siguiente carga vuelve a sembrar el estado.
      await context.addInitScript(
        ({ key, raw }) => {
          if (!localStorage.getItem(key)) localStorage.setItem(key, raw);
        },
        { key: STATE_KEY, raw },
      );
    }
    await use(context);
  },
});
