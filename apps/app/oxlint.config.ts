/// <reference types="node" />

import baseConfig from '@festivapp/config/oxlint.config.ts';
import path from 'node:path';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  plugins: ['typescript', 'unicorn', 'react', 'jsx-a11y'],
  jsPlugins: ['oxlint-tailwindcss'],
  settings: {
    tailwindcss: {
      entryPoint: path.join(import.meta.dirname, 'src', 'styles.css'),
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'tailwindcss/no-unknown-classes': 'error',
    'tailwindcss/no-duplicate-classes': 'error',
    'tailwindcss/no-conflicting-classes': 'error',
    'tailwindcss/no-deprecated-classes': 'error',
    'tailwindcss/no-unnecessary-whitespace': 'error',
    'tailwindcss/enforce-canonical': 'warn',
    'tailwindcss/enforce-shorthand': 'warn',
    'tailwindcss/enforce-sort-order': 'off',
  },
});
