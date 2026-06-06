import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['drizzle/**'],
  printWidth: 120,
  singleQuote: true,
  sortImports: {
    internalPattern: ['^src/.+', '^app/.+', '^admin/.+'],
    groups: [['builtin', 'external'], 'internal', ['value-parent', 'value-sibling', 'value-index'], 'unknown'],
  },
  sortTailwindcss: {
    stylesheet: './src/app/styles.css',
    functions: ['clsx'],
  },
});
