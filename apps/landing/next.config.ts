import { linguiMacroSwcPlugin } from '@lingui/swc-plugin/options';
import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
    serverActions: {
      bodySizeLimit: '5mb',
    },
    swcPlugins: [linguiMacroSwcPlugin()],
  },
} satisfies NextConfig;
