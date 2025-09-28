const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
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
      prettier: require('eslint-plugin-prettier')
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
  require('eslint-config-prettier'),
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '*.d.ts'
    ]
  }
];