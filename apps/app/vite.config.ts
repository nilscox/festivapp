import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import svgr from 'vite-plugin-svgr';

const sha = process.env.GIT_SHA ?? execSync('git rev-parse HEAD').toString().trim();
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
    outputFile({
      filePath: 'version',
      content: sha,
    }),
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
    host: '127.0.0.1',
    port: 8000,
    allowedHosts: ['.localhost'],
    proxy,
  },
  preview: {
    host: '127.0.0.1',
    port: 8000,
    allowedHosts: ['.localhost'],
    proxy,
  },
  define: {
    APP_VERSION: JSON.stringify(sha),
  },
});

function outputFile({ filePath, content }: { filePath: string; content: string }): Plugin {
  let dist = '';

  return {
    name: 'outputFile',
    configResolved(config) {
      dist = resolve(config.root, config.build.outDir);
    },
    async writeBundle() {
      await writeFile(join(dist, filePath), content);
    },
  };
}
