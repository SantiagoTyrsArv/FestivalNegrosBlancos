import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    // Entorno Node por defecto; los tests de componentes declaran
    // `// @vitest-environment jsdom` en su cabecera.
    environment: "node",
    setupFiles: ["./src/tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/modules/**/domain/**",
        "src/modules/**/application/**",
        "src/observability/domain/**",
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./tests/mocks/server-only.ts"),
    },
  },
});
