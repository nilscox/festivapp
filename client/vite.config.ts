/// <reference types="vitest" />
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

import tailwindcss from '@tailwindcss/vite';
import { Plugin, defineConfig, loadEnv } from 'vite';
import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa';
import solidPlugin from 'vite-plugin-solid';
import solidSvg from 'vite-plugin-solid-svg';
import tsconfigPaths from 'vite-tsconfig-paths';

import pkg from './package.json';

export default defineConfig(async ({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  const publicDir = env.PUBLIC_DIR;
  assert(publicDir !== undefined, `Missing PUBLIC_DIR environment variable`);

  const data = JSON.parse(String(await fs.readFile(path.resolve(publicDir, 'data.json'))));

  const pwa: Partial<VitePWAOptions> = {
    registerType: 'autoUpdate',
    strategies: 'generateSW',
    manifest: data.manifest,
    includeAssets: ['data.json', '**/*.jpg', '**/*.png', '**/*.webp'],
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,jpg,woff2,txt}'],
      maximumFileSizeToCacheInBytes: 5 * 1000 * 1000,
      clientsClaim: true,
      skipWaiting: true,
    },
    devOptions: {
      enabled: env.PWA_DEV === 'true',
      type: 'module',
    },
  };

  return {
    plugins: [
      tsconfigPaths(),
      solidPlugin(),
      solidSvg(),
      tailwindcss(),
      VitePWA(pwa),
      outputFile('version.txt', pkg.version),
    ],
    publicDir,
    server: {
      port: 8000,
    },
    optimizeDeps: {
      exclude: ['@cookbook/solid-intl'],
    },
    define: {
      __VERSION__: JSON.stringify(pkg.version),
    },
    test: {
      environment: 'node',
    },
  };
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
