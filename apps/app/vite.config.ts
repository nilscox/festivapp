import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const apiTarget = "http://127.0.0.1:3000";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      manifest: false,
    }),
  ],
  server: {
    allowedHosts: [".localhost"],
    proxy: {
      "/api": {
        target: apiTarget,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/manifest.webmanifest": {
        target: apiTarget,
      },
    },
  },
});
