

// Standard Manifest V3 + React + TS setup. crxjs handles the multi-entry
// build (service worker, content script, side panel) from manifest.json,
// so we don't need to hand-roll multiple Vite entry points.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],

  base: "./",

  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },

  build: {
    modulePreload: false,
  },
});