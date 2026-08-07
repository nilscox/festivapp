import { defineConfig } from 'oxlint';

export default defineConfig({
  $schema: 'https://raw.githubusercontent.com/oxc-project/oxc/main/npm/oxlint/configuration_schema.json',
  plugins: ['typescript', 'unicorn', 'import'],
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  rules: {
    'no-shadow': ['off'],
    'no-underscore-dangle': ['warn'],
    'no-unused-vars': ['error', { ignoreRestSiblings: true, argsIgnorePattern: '^_' }],
    'import/extensions': ['warn', 'ignorePackages'],
    'import/no-unassigned-import': ['warn', { allow: ['@fontsource-variable/*', '**/*.css'] }],
    'typescript/no-non-null-assertion': 'error',
  },
});
