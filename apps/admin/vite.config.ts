import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiTarget = process.env.API_TARGET ?? 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 8001,
    allowedHosts: ['.localhost'],
    proxy: {
      '/api': {
        target: apiTarget,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/files': {
        target: apiTarget,
      },
    },
  },
});
