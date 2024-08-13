import eslint from '@eslint/js';
import importX from 'eslint-plugin-import-x';
import solid from 'eslint-plugin-solid/configs/typescript.js';
import tailwind from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tailwind.configs['flat/recommended'],
  solid,
  {
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'import-x': importX,
    },
    settings: {
      'import-x/resolver': {
        typescript: true,
      },
    },
    rules: {
      ...importX.configs.recommended.rules,
      ...importX.configs.typescript.rules,
      'import-x/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
          groups: ['builtin', 'external', 'unknown', 'internal', 'parent', 'sibling', 'index'],
        },
      ],
      'solid/self-closing-comp': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
];
