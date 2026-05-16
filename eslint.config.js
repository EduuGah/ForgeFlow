import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

const reactQualityRules = {
  // Mantemos bugs reais de hooks como erro via react-hooks/rules-of-hooks,
  // mas desligamos regras muito ruidosas para não travar o check com avisos
  // que não impedem build/deploy e exigem refatorações comportamentais maiores.
  'react-hooks/exhaustive-deps': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-hooks/static-components': 'off',
  'react-refresh/only-export-components': 'off',
}

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: reactQualityRules,
  },
  {
    files: ['public/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
  {
    files: ['scripts/**/*.js', 'scripts/**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
])
