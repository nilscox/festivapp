import { linguiMacroSwcPlugin } from '@lingui/swc-plugin/options';
import type { NextConfig } from 'next';

export default {
  reactCompiler: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
    swcPlugins: [linguiMacroSwcPlugin()],
  },
} satisfies NextConfig;
