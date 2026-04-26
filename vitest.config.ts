import { resolve } from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    passWithNoTests: true,
    coverage: {
      include: ['src/core/**', 'src/infrastructure/**']
    }
  },
  resolve: {
    alias: {
      '@core': resolve('src/core'),
      '@infra': resolve('src/infrastructure'),
      '@shared': resolve('src/shared')
    }
  }
})
