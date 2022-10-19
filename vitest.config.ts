import { defineConfig } from 'vitest/config'

console.log('process.env.CI', process.env.CI)
export default defineConfig({
  test: {
    setupFiles: ['./__tests__/setup.ts'],
    include: ['./__tests__/*.spec.ts']
  }
})
