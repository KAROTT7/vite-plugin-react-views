import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    minify: false,
    lib: {
      entry: './index.ts',
      formats: ['es', 'cjs'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['fast-glob']
    }
  },
})
