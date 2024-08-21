import fs from 'node:fs/promises';
import path from 'node:path';

import dotenv from 'dotenv';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solidPlugin from 'vite-plugin-solid';
import tsconfigPaths from 'vite-tsconfig-paths';

import pkg from './package.json';

dotenv.config();

function getEnv(name: string, defaultValue?: string) {
  const value = process.env[name] ?? defaultValue;

  if (value === undefined) {
    throw new Error(`Missing ${name} environment variable`);
  }

  return value;
}

const dataPath = getEnv('DATA_PATH');
const publicDir = getEnv('PUBLIC_DIR');
const pwaDev = getEnv('PWA_DEV', 'false');

const data = await fs.readFile(path.resolve(dataPath)).then(String);
const { app } = JSON.parse(data);

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    solidPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: app.manifest,
      devOptions: {
        enabled: pwaDev === 'true',
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,woff2,txt}'],
        maximumFileSizeToCacheInBytes: 5 * 1000 * 1000,
      },
    }),
    outputFile('version.txt', pkg.version),
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
    __VERSION__: JSON.stringify(pkg.version),
  },
});

function outputFile(filePath: string, content: string): Plugin {
  let dist = '';

  return {
    name: 'outputFile',
    configResolved(config) {
      dist = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      await fs.writeFile(path.join(dist, filePath), content);
    },
  };
}
