import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettier
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn',

      // General rules
      'no-console': 'off', // Allow console.log for CLI tool
      'no-unused-vars': 'off', // Use TypeScript version instead
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],

      // Prettier integration
      'prettier/prettier': 'error',

      // Disable rules that conflict with Prettier
      'indent': 'off',
      'quotes': 'off',
      'semi': 'off'
    }
  },
  // Prettier config to disable conflicting rules
  prettierConfig,
  {
    ignores: [
      'node_modules/**',
      'build/**',
      '*.d.ts'
    ]
  }
];