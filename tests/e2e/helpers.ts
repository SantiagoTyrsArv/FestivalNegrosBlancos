import { expect, type Page } from "@playwright/test";

export const ADMIN = { email: "admin@carnaval.test", password: "Admin123!" };
export const ASISTENTE = { email: "asistente@carnaval.test", password: "Asistente123!" };

export async function iniciarSesion(
  page: Page,
  cuenta: { email: string; password: string },
  siguiente = "/"
) {
  await page.goto(`/login?siguiente=${encodeURIComponent(siguiente)}`);
  await page.getByLabel("Correo electrónico").fill(cuenta.email);
  await page.getByLabel("Contraseña").fill(cuenta.password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function cambiarModoCaos(
  page: Page,
  modo: "ninguno" | "error" | "lento" | "invalido"
) {
  await page.goto("/observatorio");
  await page.getByLabel("Modo Caos").selectOption(modo);
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByTestId("modo-caos")).not.toHaveText(/cargando/i);
}
