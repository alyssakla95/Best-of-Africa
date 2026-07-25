import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // The legacy API surface is being migrated route-by-route. Keep explicit
      // any visible in CI without making unrelated presentation work impossible.
      '@typescript-eslint/no-explicit-any': 'warn',
      // React 18 data-loading effects are valid in this application. The React
      // Compiler advisory remains visible while those screens move to queries.
      'react-hooks/set-state-in-effect': 'warn',
      // Co-located context hooks and tiny render helpers are intentional.
      'react-refresh/only-export-components': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
])
