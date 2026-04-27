import tseslint from '@electron-toolkit/eslint-config-ts'

export default tseslint.config(
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**']
  },
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/triple-slash-reference': 'off',
      'no-empty': 'off'
    }
  },
  {
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@infra/*', '@renderer/*', '**/infrastructure/**', '**/renderer/**', '**/main/**', '**/preload/**'],
            message: 'Core must stay independent from infrastructure, renderer, main, and preload layers.'
          },
          {
            group: ['electron', 'node:*'],
            message: 'Core must stay platform-independent; inject platform data through shared types instead.'
          }
        ]
      }]
    }
  },
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@infra/*', '**/infrastructure/**', '**/main/**', '**/preload/**', 'electron', 'node:*'],
            message: 'Renderer code must use window.xms/services and must not import infrastructure, main, preload, Electron, or Node APIs.'
          }
        ]
      }]
    }
  },
  {
    files: ['src/preload/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@core/*', '@infra/*', '@renderer/*', '**/core/**', '**/infrastructure/**', '**/renderer/**', '**/main/**', 'node:*'],
            message: 'Preload is only the typed IPC bridge; keep domain, infrastructure, renderer, and Node logic out.'
          }
        ]
      }]
    }
  },
  {
    files: ['src/infrastructure/**/*.ts'],
    ignores: ['src/infrastructure/**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['@core/*', '@renderer/*', '**/core/**', '**/renderer/**', '**/main/**', '**/preload/**'],
            message: 'Infrastructure must not depend on core, renderer, main, or preload layers.'
          }
        ]
      }]
    }
  }
)
