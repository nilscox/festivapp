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
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: false,
      workbox: {
        runtimeCaching: [
          {
            urlPattern: ({ sameOrigin, url }) => sameOrigin && url.pathname.startsWith('/files/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'tenant-files',
              expiration: { maxEntries: 60, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
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
