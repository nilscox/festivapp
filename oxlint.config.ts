import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'unicorn', 'react', 'react-perf', 'nextjs', 'oxc', 'import', 'jsx-a11y'],
  categories: {
    correctness: 'error',
  },
  options: {
    typeAware: true,
  },
  rules: {},
});
