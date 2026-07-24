import baseConfig from '@festivapp/config/oxlint.config.ts';
import { defineConfig } from 'oxlint';

export default defineConfig({
  extends: [baseConfig],
  rules: {
    'no-async-endpoint-handlers': 'off',
  },
});
