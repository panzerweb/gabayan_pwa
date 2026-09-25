import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'coverage/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.{ts,vue}', 'tests/**/*.ts', '*.config.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'vue/max-attributes-per-line': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/html-indent': 'off',
      'vue/html-self-closing': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/singleline-html-element-content-newline': 'off',
    },
  },
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    // Every .vue file binds what a composable returns; server state, HTTP and the data layer
    // stay behind composables, whether the file is a feature view, a shared component or a
    // layout.
    files: ['src/**/*.vue'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@tanstack/vue-query',
              message: 'Wrap queries and mutations in a presentation/composables/use<Thing>.ts.',
            },
          ],
          patterns: [
            {
              regex: '^@/?core/http(/|$)',
              message: 'Call the API through the feature repository, from a composable.',
            },
            {
              regex: '(^|/)data(/|$)',
              message: 'Import data/ modules from a composable, never from a .vue file.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['mock-api/**/*.mjs', 'tests/contract/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
