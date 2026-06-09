import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    authInterrupts: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
} satisfies NextConfig;
