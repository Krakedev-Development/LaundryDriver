const { test, expect, STATE_KEY } = require("./support/fixtures.cjs");
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
});
// Un chofer real entra con sesión: los avances se envían al servidor con su token.
async function signedIn(page) {
  await page.evaluate(() =>
    localStorage.setItem("laundry.driver.auth.accessToken", "test-access"),
  );
  await page.reload();
  await expect(page.getByRole("tab", { name: "Mi ruta", exact: true })).toBeVisible();
}
test("driver sections retain the service filter when leaving and returning", async ({
  page,
}) => {
  await page.getByRole("tab", { name: "Servicios", exact: true }).click();
  await page.getByRole("radio", { name: "Próximos", exact: true }).click();
  for (const name of ["Perfil", "Historial", "Mi ruta", "Servicios"]) {
    await page.getByRole("tab", { name, exact: true }).click();
    await expect(page.getByRole("tab", { name, exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByRole("tablist")).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "Abrir menú lateral", exact: true }),
    ).toHaveCount(0);
    if (name === "Perfil") {
      await expect(
        page.getByText("Carlos Mendoza", { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByText("carlos.mendoza@laundryfresh.com", { exact: true }),
      ).toBeVisible();
      await expect(page.getByText("Chofer", { exact: true })).toHaveCount(0);
    }
  }
  await expect(
    page.getByRole("radio", { name: "Próximos", exact: true }),
  ).toBeChecked();
});
test("driver pickup, plant, delivery, recipient and history form a complete route", async ({
  page,
}) => {
  // Los avances sin código se registran primero en el servidor: aquí el servidor los acepta.
  const transitions = [];
  await page.route(/\/api\/v1\/orders\/[^/]+\/transitions$/, async (route) => {
    const cors = { "access-control-allow-origin": "*" };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const body = route.request().postDataJSON();
    const id = route.request().url().split("/orders/")[1].split("/")[0];
    // Como el servidor: las transiciones con código de custodia no se aceptan por esta vía.
    if (["PICKED_UP", "AT_FACILITY", "OUT_FOR_DELIVERY", "DELIVERED"].includes(body.to))
      return route.fulfill({
        status: 409,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify({ message: "Esta transición la realiza el módulo de custodia, no se fuerza manualmente." }),
      });
    transitions.push(body.to);
    return route.fulfill({
      status: 201,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify({
        id,
        status: body.to,
        version: body.expectedVersion + 1,
        mode: "HOME_HOME",
        total: "0",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  // La recogida se valida en el servidor con el código de custodia del cliente.
  const verifications = [];
  await page.route(/\/api\/v1\/orders\/[^/]+\/handoffs\/verify$/, async (route) => {
    const cors = { "access-control-allow-origin": "*" };
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const body = route.request().postDataJSON();
    verifications.push(body);
    const id = route.request().url().split("/orders/")[1].split("/")[0];
    return route.fulfill({
      status: 201,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify({
        id,
        status: body.type === "DRIVER_TO_CUSTOMER" ? "DELIVERED" : "PICKED_UP",
        version: body.expectedVersion + 1,
        mode: "HOME_HOME",
        total: "0",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  // Retiro en planta para reparto: el chofer genera su código y la sede lo valida en la web.
  await page.route(/\/api\/v1\/orders\/[^/]+(\/handoffs\/issue)?$/, async (route) => {
    const cors = { "access-control-allow-origin": "*" };
    const req = route.request();
    if (req.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const id = req.url().split("/orders/")[1].split("/")[0];
    const issue = req.url().endsWith("/handoffs/issue");
    return route.fulfill({
      status: issue ? 201 : 200,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify(
        issue
          ? {
              handoffId: "h-out",
              type: "FACILITY_TO_DRIVER",
              code: "731045",
              qrToken: "AbCdEfGhIjKlMnOpQrStUvWxYz012345",
              expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            }
          : { id, status: "OUT_FOR_DELIVERY", version: 30, mode: "HOME_HOME", total: "0", createdAt: new Date().toISOString() },
      ),
    });
  });
  await signedIn(page);
  await page
    .getByRole("button", { name: "Marcar llegada al domicilio", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar recogida de prendas", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Confirmar recogida", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", {
      name: "Observaciones y evidencia (opcional)",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Observaciones de recogida", exact: true })
    .fill("Bolsa sellada");
  await page
    .getByRole("textbox", { name: "Código de 6 dígitos", exact: true })
    .fill("482910");
  await page
    .getByRole("checkbox", {
      name: "Verifiqué las prendas con el cliente",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Confirmar recogida", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ir a planta central", exact: true }),
  ).toBeVisible();
  expect(verifications).toHaveLength(1);
  expect(verifications[0]).toMatchObject({
    type: "CUSTOMER_TO_DRIVER",
    code: "482910",
    notes: "Bolsa sellada",
  });
  expect(verifications[0].declaredCount).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Ir a planta central", exact: true })
    .click();
  // La salida a planta se registra en el servidor; al llegar, la entrega se valida con código.
  await expect(
    page.getByRole("button", { name: "Mostrar código para la sede", exact: true }),
  ).toBeVisible();
  expect(transitions).toContain("HEADING_TO_FACILITY");
  // La operación de planta no es del chofer: se deja el servicio listo para entrega.
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    const order = state.orders.find((o) => o.id === "SOL-4587");
    order.status = "DELIVERY_ASSIGNED";
    order.paymentStatus = "PAGADO";
    localStorage.setItem(key, JSON.stringify(state));
  }, STATE_KEY);
  await page.reload();
  await page
    .getByRole("button", { name: "Mostrar código para retirar en planta", exact: true })
    .click();
  await expect(page.getByTestId("driver_handoff_code")).toContainText("731 045");
  // Cuando la sede valida (la app consulta cada 5 s), se abre la navegación hacia el cliente.
  await expect(
    page.getByRole("button", { name: "Navegar con Google Maps", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Atrás", exact: true }).click();
  await page
    .getByRole("button", { name: "Marcar llegada a entrega", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega al cliente", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Nombre de quien recibe", exact: true })
    .fill("Ana Torres");
  await page
    .getByRole("button", { name: "Relación con el cliente", exact: true })
    .click();
  await page.getByRole("radio", { name: "Familiar", exact: true }).click();
  await page
    .getByRole("checkbox", {
      name: "Confirmo la entrega completa a la persona indicada",
      exact: true,
    })
    .click();
  await page
    .getByRole("textbox", { name: "Código de 6 dígitos", exact: true })
    .fill("265810");
  await page
    .getByRole("button", { name: "Confirmar entrega", exact: true })
    .click();
  await expect(page.getByRole("tab", { name: "Historial", exact: true })).toBeVisible();
  expect(verifications.at(-1)).toMatchObject({
    type: "DRIVER_TO_CUSTOMER",
    code: "265810",
    recipientName: "Ana Torres",
    recipientRelationship: "Familiar",
  });
  await page.getByRole("tab", { name: "Historial", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Constancia de entrega", exact: true })
    .click();
  await expect(
    page.getByText("Ana Torres · Familiar", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/driver-completed.png",
    fullPage: true,
  });
  // Las llegadas quedaron registradas en el servidor, no solo en el teléfono.
  expect(transitions).toEqual(
    expect.arrayContaining(["ARRIVED_FOR_PICKUP", "ARRIVED_FOR_DELIVERY"]),
  );
});

test("sin conexión, marcar la llegada no avanza y se explica por qué", async ({ page }) => {
  await signedIn(page);
  await page
    .getByRole("button", { name: "Marcar llegada al domicilio", exact: true })
    .click();
  await expect(
    page.getByText(
      "Sin conexión: el avance no se registró. Intenta de nuevo cuando tengas señal.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Marcar llegada al domicilio", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar recogida de prendas", exact: true }),
  ).toHaveCount(0);
});

test("driver chat keeps customer contact and messages after reload", async ({ page }) => {
  await page.getByRole("button", { name: "Abrir chat con el cliente", exact: true }).click();
  await page.getByRole("textbox", { name: "Escribe un mensaje", exact: true }).fill("Estoy llegando al domicilio.");
  await page.getByRole("button", { name: "Enviar mensaje", exact: true }).click();
  await expect(page.getByText("Estoy llegando al domicilio.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Abrir chat con el cliente", exact: true }).click();
  await expect(page.getByText("Estoy llegando al domicilio.", { exact: true })).toBeVisible();
});

test("la recogida exige el código del cliente y no avanza sin él", async ({ page }) => {
  const cors = { "access-control-allow-origin": "*" };
  let verifyCalls = 0;
  await page.route(/\/api\/v1\/orders\/[^/]+\/(transitions|handoffs\/verify)$/, async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const url = route.request().url();
    const body = route.request().postDataJSON();
    if (url.endsWith("/handoffs/verify")) verifyCalls++;
    return route.fulfill({
      status: 201,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify({
        id: url.split("/orders/")[1].split("/")[0],
        status: body.to ?? "PICKED_UP",
        version: body.expectedVersion + 1,
        mode: "HOME_HOME",
        total: "0",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  await signedIn(page);
  await page.getByRole("button", { name: "Marcar llegada al domicilio", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar recogida de prendas", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Verifiqué las prendas con el cliente", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar recogida", exact: true }).click();
  await expect(
    page.getByText("Ingresa el código de 6 dígitos que muestra el cliente o escanea su QR.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(verifyCalls).toBe(0);
  await expect(page.getByRole("button", { name: "Ir a planta central", exact: true })).toHaveCount(0);
});

test("la recogida fallida exige motivo, se reporta al servidor y retira el servicio de la ruta", async ({ page }) => {
  const cors = { "access-control-allow-origin": "*" };
  const reports = [];
  await page.route(/\/api\/v1\/orders\/[^/]+\/(transitions|failed-pickup)$/, async (route) => {
    if (route.request().method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const url = route.request().url();
    const body = route.request().postDataJSON();
    if (url.endsWith("/failed-pickup")) reports.push(body);
    return route.fulfill({
      status: 201,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify({
        id: url.split("/orders/")[1].split("/")[0],
        status: url.endsWith("/failed-pickup") ? "INCIDENT" : body.to,
        version: body.expectedVersion + 1,
        mode: "HOME_HOME",
        total: "0",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  await signedIn(page);
  await page.getByRole("button", { name: "Marcar llegada al domicilio", exact: true }).click();
  await page.getByRole("button", { name: "Recogida fallida", exact: true }).click();
  await page.getByRole("button", { name: "Reportar recogida fallida", exact: true }).click();
  await expect(page.getByText("Elige el motivo de la recogida fallida.", { exact: true })).toBeVisible();
  expect(reports).toHaveLength(0);
  await page.getByRole("radio", { name: "Cliente ausente", exact: true }).click();
  await page.getByRole("textbox", { name: "Detalle (opcional)", exact: true }).fill("Tocó el timbre 3 veces");
  await page.getByRole("button", { name: "Reportar recogida fallida", exact: true }).click();
  await expect.poll(() => reports.length).toBe(1);
  expect(reports[0].reason).toBe("Cliente ausente: Tocó el timbre 3 veces");
  await expect(page.getByRole("button", { name: "Confirmar recogida de prendas", exact: true })).toHaveCount(0);
});

test("en planta el chofer muestra su código y avanza cuando la sede lo valida", async ({ page }) => {
  const cors = { "access-control-allow-origin": "*" };
  let validated = false;
  const issued = [];
  await page.route(/\/api\/v1\/orders\/[^/]+(\/handoffs\/issue)?$/, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    const url = req.url();
    const id = url.split("/orders/")[1].split("/")[0];
    if (url.endsWith("/handoffs/issue")) {
      issued.push(req.postDataJSON());
      return route.fulfill({
        status: 201,
        headers: cors,
        contentType: "application/json",
        body: JSON.stringify({
          handoffId: "h-1",
          type: "DRIVER_TO_FACILITY",
          code: "482910",
          qrToken: "AbCdEfGhIjKlMnOpQrStUvWxYz012345",
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        }),
      });
    }
    // La sede valida en la web: la siguiente consulta ya trae la solicitud En planta.
    return route.fulfill({
      status: 200,
      headers: cors,
      contentType: "application/json",
      body: JSON.stringify({
        id,
        status: validated ? "AT_FACILITY" : "HEADING_TO_FACILITY",
        version: validated ? 9 : 8,
        mode: "HOME_HOME",
        total: "0",
        createdAt: new Date().toISOString(),
      }),
    });
  });
  await signedIn(page);
  // El servicio ya va camino a planta.
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    const order = state.orders.find((o) => o.id === "SOL-4587");
    order.status = "HEADING_TO_FACILITY";
    localStorage.setItem(key, JSON.stringify(state));
  }, STATE_KEY);
  await page.reload();
  await page.getByRole("button", { name: "Mostrar código para la sede", exact: true }).click();
  await expect(page.getByTestId("driver_handoff_code")).toContainText("482 910");
  expect(issued).toEqual([{ type: "DRIVER_TO_FACILITY" }]);
  validated = true;
  await expect(page.getByRole("button", { name: "Mostrar código para la sede", exact: true })).toHaveCount(0, {
    timeout: 15000,
  });
  const status = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key));
    return state.orders.find((o) => o.id === "SOL-4587").status;
  }, STATE_KEY);
  expect(status).toBe("AT_FACILITY");
});

test("en la app compilada no existe la ubicación de prueba en Guayaquil", async ({ page }) => {
  // La app de los choferes no puede declarar una ubicación inventada (solo en desarrollo).
  await expect(page.getByRole("button", { name: "Reportar ubicación en Guayaquil (Demo)" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Perfil", exact: true }).click();
  await expect(page.getByText("Disponible", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Reportar ubicación en Guayaquil (Demo)" })).toHaveCount(0);
});
