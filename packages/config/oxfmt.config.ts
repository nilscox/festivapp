import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 120,
  singleQuote: true,
  sortImports: {
    groups: [['builtin', 'external'], 'internal', ['value-parent', 'value-sibling', 'value-index'], 'unknown'],
  },
});
