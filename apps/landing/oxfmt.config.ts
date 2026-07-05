import baseConfig from '@festivapp/config/oxfmt';
import { defineConfig } from 'oxfmt';

export default defineConfig({
  ...baseConfig,
  ignorePatterns: ['src/i18n/locales/*/messages.ts'],
});
