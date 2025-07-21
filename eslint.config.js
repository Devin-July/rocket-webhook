import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'
import prettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      semi: ['error', 'never'],
      'no-extra-parens': 'off',
      '@typescript-eslint/no-extra-parens': ['error'],
      'no-magic-numbers': 'off',
      '@typescript-eslint/no-parameter-properties': 0,
      '@typescript-eslint/no-floating-promises': ['error'],
      '@typescript-eslint/array-type': [0, 'generic'],
      '@typescript-eslint/no-use-before-define': 0,
      '@typescript-eslint/no-var-requires': 0,
      '@typescript-eslint/ban-ts-ignore': 0,
      '@typescript-eslint/no-empty-function': 0,
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      'import/no-extraneous-dependencies': ['error'],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      ...prettier.rules,
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', '**/*.d.ts'],
  },
]
