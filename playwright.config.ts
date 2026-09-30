import { defineConfig, devices } from "@playwright/test";

const puerto = Number(process.env["PUERTO_E2E"] ?? 3100);
const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? `http://localhost:${puerto}`;

/**
 * Los E2E corren contra el build de producción (`next start`): en desarrollo
 * todas las páginas se renderizan bajo demanda y SSG/ISR no se comportarían
 * como en producción. Se ejecutan en serie porque comparten el estado en
 * memoria del servidor (Modo Caos, cupos, agenda).
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 1 : 0,
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL, trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env["PLAYWRIGHT_BASE_URL"]
    ? undefined
    : {
        command: `pnpm start -p ${puerto}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
