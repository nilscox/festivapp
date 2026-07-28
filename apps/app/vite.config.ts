import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: false,
    }),
  ],
  server: {
    port: 8000,
    allowedHosts: ['.localhost'],
    proxy: {
      '/api': {
        target: apiTarget,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/manifest.webmanifest': {
        target: apiTarget,
      },
      '/files': {
        target: apiTarget,
      },
    },
  },
});
