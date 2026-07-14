import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'fr'],
  catalogs: [
    {
      path: '<rootDir>/src/i18n/locales/{locale}/messages',
      include: ['<rootDir>/src'],
      // The service worker (src/sw.js) and its route folder (src/app/sw.js/) have
      // no translatable strings and the ".js" folder name trips up the extractor.
      exclude: ['<rootDir>/src/sw.js', '<rootDir>/src/app/sw.js'],
    },
  ],
  format: formatter({ lineNumbers: false }),
});
