import eslint from '@eslint/js';
import tailwind from 'eslint-plugin-better-tailwindcss';
import solid from 'eslint-plugin-solid/configs/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  solid,
  {
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'better-tailwindcss': tailwind,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
      'better-tailwindcss': {
        entryPoint: 'src/index.css',
      },
    },
    rules: {
      'solid/self-closing-comp': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      ...tailwind.configs['stylistic'].rules,
      ...tailwind.configs['correctness'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
    },
  },
];
