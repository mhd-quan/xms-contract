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
)
