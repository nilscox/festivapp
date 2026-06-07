import baseConfig from '@festivapp/config/oxlint';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  plugins: ['typescript', 'oxc', 'unicorn', 'react', 'react-perf', 'nextjs', 'jsx-a11y'],
  rules: {
    'jsx-a11y/prefer-tag-over-role': 'off',
    'nextjs/no-img-element': 'off',
  },
});
