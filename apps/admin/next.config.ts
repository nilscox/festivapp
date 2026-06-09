import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  experimental: {
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
} satisfies NextConfig;
