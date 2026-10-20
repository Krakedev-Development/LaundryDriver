const { test, expect } = require("@playwright/test");
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "Chofer demo", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
});
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
    .getByRole("textbox", {
      name: "Código de transferencia (opcional)",
      exact: true,
    })
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
  await page
    .getByRole("button", { name: "Ir a planta central", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirmar entrega en planta", exact: true })
    .click();
  await page.getByRole("tab", { name: "Servicios", exact: true }).click();
  await page.getByRole("radio", { name: "Próximos", exact: true }).click();
  await page
    .getByRole("button", { name: "Ver detalle de SOL-4587", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Herramientas de planta · Demo", exact: true })
    .click();
  for (const action of [
    "Simular ingreso a lavado",
    "Simular control de calidad",
    "Simular prendas listas",
    "Simular asignación de entrega",
  ])
    await page
      .getByRole("button", { name: `${action} · Demo`, exact: true })
      .click();
  await page
    .getByRole("button", { name: "Iniciar navegación de entrega", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Navegar con Google Maps", exact: true }),
  ).toBeVisible();
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
    .getByRole("button", { name: "Confirmar entrega", exact: true })
    .click();
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
