import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/valuation-game-web/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/testSetup.ts"],
    clearMocks: true,
  },
});
