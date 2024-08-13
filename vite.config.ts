import fs from 'node:fs/promises';
import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

dotenv.config();

function getEnv(name: string) {
  const value = process.env[name];

  if (value === undefined) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

const dataPath = getEnv('DATA_PATH');
const publicDir = getEnv('PUBLIC_DIR');

const data = await fs.readFile(path.resolve(dataPath)).then(String);
const { app } = JSON.parse(data);

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: app.manifest,
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1000 * 1000,
        skipWaiting: true,
      },
    }),
  ],
  publicDir,
  optimizeDeps: {
    exclude: ['@cookbook/solid-intl', '@modular-forms/solid'],
  },
  server: {
    port: 8000,
  },
  build: {
    target: 'esnext',
  },
  define: {
    __DATA__: data,
  },
});
