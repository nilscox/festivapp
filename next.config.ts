import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
} satisfies NextConfig;
