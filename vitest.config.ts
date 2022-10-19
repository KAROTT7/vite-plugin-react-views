import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
    include: ['./__tests__/*.spec.ts']
  }
})
