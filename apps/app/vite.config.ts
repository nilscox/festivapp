import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:3000';

const proxy = {
  '/api': {
    target: apiTarget,
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
  '/manifest.webmanifest': {
    target: apiTarget,
  },
  '/files': {
    target: apiTarget,
  },
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      devOptions: { enabled: true, type: 'module' },
      manifest: false,
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
    }),
  ],
  server: {
    port: 8000,
    allowedHosts: ['.localhost'],
    proxy,
  },
  preview: {
    port: 8000,
    allowedHosts: ['.localhost'],
    proxy,
  },
});
