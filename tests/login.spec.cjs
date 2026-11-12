const { test, expect } = require("@playwright/test");

const cors = { "access-control-allow-origin": "*" };
const TOKENS = { accessToken: "t-access", refreshToken: "t-refresh", expiresIn: 900 };

// La aplicación arranca vacía y sin sesión; solo se simula la API de autenticación.
function mockApi(page, { status = "ACTIVE" } = {}) {
  return page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname.replace(/^.*\/api\/v1/, "");
    const send = (code, body) =>
      route.fulfill({ status: code, headers: cors, contentType: "application/json", body: JSON.stringify(body) });
    if (request.method() === "OPTIONS")
      return route.fulfill({
        status: 204,
        headers: { ...cors, "access-control-allow-headers": "*", "access-control-allow-methods": "*" },
      });
    if (path === "/auth/login") {
      const { email } = request.postDataJSON();
      if (email === "cliente@correo.test")
        return send(200, {
          user: { id: "u2", email, name: "Cliente", role: "CLIENT", status: "ACTIVE", facilityId: null },
          tokens: TOKENS,
        });
      if (email !== "chofer@correo.test") return send(401, { message: "Credenciales incorrectas." });
      return send(200, {
        user: { id: "u1", email, name: "Chofer de Prueba", role: "DRIVER", status, facilityId: null },
        tokens: TOKENS,
      });
    }
    if (path === "/auth/logout") return route.fulfill({ status: 204, headers: cors });
    return send(200, []);
  });
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("la app arranca sin sesión ni datos de demostración", async ({ page }) => {
  await expect(page.getByTestId("login_email_input")).toHaveValue("");
  await expect(page.getByTestId("login_password_input")).toHaveValue("");
  await expect(page.getByText(/demo/i)).toHaveCount(0);
  await expect(page.getByRole("tablist")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Crear cuenta", exact: true })).toHaveCount(0);
  await expect(page.getByText(/Tu cuenta de chofer es creada por administración/)).toBeVisible();
});

test("rechaza credenciales incorrectas y cuentas que no son de chofer", async ({ page }) => {
  await page.getByTestId("login_email_input").fill("otro@correo.test");
  await page.getByTestId("login_password_input").fill("ClaveSegura123");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);

  await page.getByTestId("login_email_input").fill("cliente@correo.test");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
});

test("un chofer provisionado entra y conserva la sesión al recargar", async ({ page }) => {
  await page.getByTestId("login_email_input").fill("chofer@correo.test");
  await page.getByTestId("login_password_input").fill("ClaveSegura123");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByRole("tab", { name: "Mi ruta", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("tab", { name: "Mi ruta", exact: true })).toBeVisible();
});

test("una contraseña temporal exige cambiarla antes de entrar a la ruta", async ({ page }) => {
  await page.unroute("**/api/v1/**");
  await mockApi(page, { status: "PASSWORD_CHANGE_REQUIRED" });
  await page.getByTestId("login_email_input").fill("chofer@correo.test");
  await page.getByTestId("login_password_input").fill("Temporal123");
  await page.getByTestId("login_submit_button").click();
  await expect(page.getByText("Crea tu contraseña definitiva", { exact: true })).toBeVisible();
  await expect(page.getByRole("tablist")).toHaveCount(0);
  const password = page.getByLabel("Nueva contraseña", { exact: true });
  await password.fill("nueva");
  await password.blur();
  await expect(
    page.getByText("Usa 8 caracteres, una mayúscula y un número.", { exact: true }),
  ).toBeVisible();
});
