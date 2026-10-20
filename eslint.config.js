import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.strict],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Docs metadata files and tests export helpers alongside components by design.
    files: [
      '**/*.docs.tsx',
      '**/*.test.tsx',
      'src/test/**',
      'src/**/context.tsx',
      'src/**/*Provider.tsx',
    ],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    files: ['scripts/**/*.ts', 'vite.config.ts', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  prettier,
);
