import viteReact from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }) as PluginOption,
    viteReact(),
  ],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
