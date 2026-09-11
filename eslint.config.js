export default [
  {
    ignores: [
      'node_modules/**',
      '**/dist/**',
      'apps/backend/data/**',
      'apps/backend/uploads/**',
    ],
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        console: 'readonly',
        confirm: 'readonly',
        crypto: 'readonly',
        document: 'readonly',
        FileReader: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        navigator: 'readonly',
        window: 'readonly',
      },
    },
    rules: { 'no-unused-vars': 'warn', 'no-undef': 'error' },
  },
];
