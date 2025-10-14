import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      jsxA11y.flatConfigs.recommended,
      prettier,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'import-x': importX,
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,

      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // React rules
      'react/prop-types': 'off', // TypeScript handles this
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      'react/no-unknown-property': [
        'error',
        {
          ignore: [
            // PixiJS React properties
            'texture',
            'anchor',
            'x',
            'y',
            'rotation',
            'scale',
            'alpha',
            'tint',
            'blendMode',
            'filters',
            'mask',
            'position',
            'pivot',
            'skew',
          ],
        },
      ],

      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': 'error', // Using unused-imports instead
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',

      // Import sorting rules
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports
            ['^\\u0000'],
            // Node.js builtins
            ['^node:'],
            // React and packages
            ['^react', '^@?\\w'],
            // Internal packages
            ['^(@|components|utils|hooks|types|assets)(/.*|$)'],
            // Parent imports
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Same folder imports
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.?(css)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Import rules
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-unresolved': 'off', // TypeScript handles this
      'import-x/no-named-as-default-member': 'off',

      // Prettier integration
      'prettier/prettier': 'error',
    },
  }
);
