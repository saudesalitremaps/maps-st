import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "api",
    globals: true,
    environment: "node",
    setupFiles: ["./tests/mocks.ts", "./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    clearMocks: true,
    mockReset: true,
    restoreMocks: false,
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/app/api/**/*.ts", "src/lib/**/*.ts"],
      exclude: ["src/lib/prisma.ts", "src/types/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
