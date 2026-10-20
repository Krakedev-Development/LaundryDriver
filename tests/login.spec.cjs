const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("driver login has no registration and rejects customer credentials", async ({
  page,
}) => {
  await expect(
    page.getByRole("button", { name: "Crear cuenta", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Cliente demo", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Tu cuenta de chofer es creada por administración/),
  ).toBeVisible();
  await page.getByTestId("login_email_input").fill("maria.torres@gmail.com");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("alert")).toContainText("incorrect");
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await page.getByRole("button", { name: "Chofer demo", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
});

test("an administrator temporary password requires a change before entering the route", async ({
  page,
}) => {
  await page.evaluate(() => {
    const key = "laundry.driver-mvp.v1";
    const state = JSON.parse(localStorage.getItem(key));
    state.driver.mustChangePassword = true;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await page.getByTestId("login_submit_button").click();
  await expect(
    page.getByText("Crea tu contraseña definitiva", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  const password = page.getByLabel("Nueva contraseña", { exact: true });
  await password.fill("nueva");
  await password.blur();
  await expect(
    page.getByText("Usa 8 caracteres, una mayúscula y un número.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Nueva contraseña", exact: true })
    .fill("Definitiva123");
  await page
    .getByRole("textbox", { name: "Confirmar contraseña", exact: true })
    .fill("Definitiva123");
  await page
    .getByRole("button", { name: "Guardar contraseña", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "Mi ruta", exact: true }),
  ).toBeVisible();
});
