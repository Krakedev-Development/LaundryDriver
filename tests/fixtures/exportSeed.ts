import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { initializeSeededState } from "./seedState";

// Genera el estado de prueba que usan las pruebas de interfaz (Playwright). El producto
// arranca vacío: estos datos existen solo para las pruebas y no se versionan.
const state = initializeSeededState();
state.session = { id: state.driver.id, role: "DRIVER" };
const out = join(__dirname, "generated");
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "seed-state.json"), JSON.stringify(state));
console.log("Estado de prueba generado en tests/fixtures/generated/seed-state.json");
