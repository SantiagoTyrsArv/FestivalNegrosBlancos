import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ADMIN, ASISTENTE, cambiarModoCaos, iniciarSesion } from "./helpers";

test.describe("SSG", () => {
  test("navega por páginas estáticas y muestra la insignia del patrón con ?debug=1", async ({
    page,
  }) => {
    await page.goto("/?debug=1");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("summary", { hasText: "SSG" })).toBeVisible();
    await page.getByRole("link", { name: "Comparsas" }).first().click();
    await expect(page).toHaveURL(/\/comparsas$/);
    await page.getByRole("link", { name: "Maravilla Andina" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Maravilla Andina" })).toBeVisible();
  });

  test("dynamicParams = false: un slug desconocido responde 404", async ({ page }) => {
    const r = await page.goto("/comparsas/no-existe");
    expect(r?.status()).toBe(404);
  });
});

test.describe("ISR + admin", () => {
  test("editar un evento en /admin actualiza /programacion sin rebuild", async ({ page }) => {
    const nuevo = `Noche de marimba ${Date.now()}`;
    await iniciarSesion(page, ADMIN, "/admin");
    const formulario = page.locator("details", { hasText: "Noche de marimba" }).first();
    await formulario.locator("summary").click();
    await formulario.getByLabel("Nombre").fill(nuevo);
    await formulario.getByRole("button", { name: "Guardar y revalidar" }).click();
    await expect(page.getByText(/Guardado\. Etiquetas revalidadas/)).toBeVisible();

    await page.goto("/programacion");
    await expect(page.getByRole("heading", { name: nuevo })).toBeVisible();
  });
});

test.describe("SSR + compra", () => {
  test("checkout exige sesión y la compra devuelve un código", async ({ page }) => {
    await page.goto("/checkout?sesion=1");
    await expect(page).toHaveURL(/\/login\?siguiente=/);

    await iniciarSesion(page, ASISTENTE, "/boletas");
    await page.goto("/boletas");
    await page
      .getByRole("link", { name: /Ver localidades/ })
      .first()
      .click();
    await expect(page.getByRole("heading", { name: "Cupo en tiempo real" })).toBeVisible();
    await page.getByRole("link", { name: "Comprar" }).first().click();
    await page.getByRole("button", { name: "Confirmar compra" }).click();
    await expect(page.getByTestId("codigo-boleta")).toHaveText(/^CBN-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  test("una localidad agotada no ofrece compra", async ({ page }) => {
    // Evento 2 ("Noche de marimba"): el palco se siembra agotado (200/200).
    await page.goto("/boletas/2");
    const palco = page.locator("li", { hasText: "Palco" });
    await expect(palco.getByText("Agotado")).toBeVisible();
    await expect(palco.getByRole("link", { name: "Comprar" })).toHaveCount(0);
  });
});

test.describe("CSR", () => {
  test("mi agenda: actualización optimista con rollback si el servidor falla", async ({ page }) => {
    await iniciarSesion(page, ASISTENTE, "/mi-agenda");
    await page.goto("/mi-agenda");
    const lista = page.getByTestId("lista-agenda");

    // Éxito: el evento aparece y persiste.
    const primero = page.getByRole("button", { name: /^Agregar:/ }).first();
    const nombre = ((await primero.getAttribute("aria-label")) ?? "").replace("Agregar: ", "");
    await primero.click();
    await expect(lista.getByText(nombre)).toBeVisible();

    // Fallo simulado: la UI cambia al instante y luego se deshace.
    await page.route("**/api/v1/agenda", (ruta) =>
      ruta.request().method() === "POST"
        ? ruta.fulfill({
            status: 500,
            contentType: "application/problem+json",
            body: '{"title":"fallo"}',
          })
        : ruta.continue()
    );
    const segundo = page.getByRole("button", { name: /^Agregar:/ }).first();
    const otro = ((await segundo.getAttribute("aria-label")) ?? "").replace("Agregar: ", "");
    await segundo.click();
    await expect(page.getByText("No se pudo guardar el cambio. Lo deshicimos.")).toBeVisible();
    await expect(lista.getByText(otro)).toHaveCount(0);
  });

  test("en vivo: el contenido no está en el HTML inicial y aparece en el cliente", async ({
    page,
    request,
  }) => {
    const html = await (await request.get("/en-vivo")).text();
    expect(html).not.toContain("data-contenido-principal");
    await page.goto("/en-vivo");
    await expect(page.locator("[data-contenido-principal]")).toBeVisible();
  });
});

test.describe("Modo Caos", () => {
  test.afterEach(async ({ page }) => {
    await cambiarModoCaos(page, "ninguno");
  });

  test("ISR sigue sirviendo la última versión, SSR degrada controlado y CSR muestra reintento", async ({
    page,
  }) => {
    await page.goto("/programacion"); // asegura una versión cacheada
    await iniciarSesion(page, ADMIN, "/observatorio");
    await cambiarModoCaos(page, "error");
    await expect(page.getByTestId("modo-caos")).toContainText("Error 503");

    const isr = await page.goto("/programacion");
    expect(isr?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: "Programación" })).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();

    await page.goto("/buscar?q=marimba");
    await expect(
      page.getByRole("alert").filter({ hasText: "La programación no está disponible" })
    ).toBeVisible();
    await expect(page.getByText("503")).toHaveCount(0); // sin filtrar detalles internos

    await page.goto("/en-vivo");
    await expect(page.getByText("No pudimos actualizar el desfile")).toBeVisible();
    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
  });
});

test.describe("Observatorio y accesibilidad", () => {
  test("el observatorio lista rutas con su patrón", async ({ page }) => {
    await page.goto("/programacion");
    await page.goto("/historia");
    await page.goto("/observatorio");
    await expect(page.getByRole("rowheader", { name: "/historia" })).toBeVisible({
      timeout: 15_000,
    });
  });

  for (const ruta of [
    "/",
    "/programacion",
    "/boletas",
    "/login",
    "/en-vivo",
    "/observatorio/costos",
  ]) {
    test(`sin violaciones axe críticas en ${ruta}`, async ({ page }) => {
      await page.goto(ruta);
      await page.waitForLoadState("load");
      await page.waitForTimeout(500); // deja pintar el contenido CSR
      const r = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      const graves = r.violations.filter((v) => v.impact === "critical" || v.impact === "serious");
      expect(graves.map((v) => `${v.id}: ${v.nodes[0]?.target.join(" ")}`)).toEqual([]);
    });
  }
});
