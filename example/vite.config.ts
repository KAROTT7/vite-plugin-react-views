import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import router from 'vite-plugin-react-views'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    router({
      exclude(path) {
        return path.includes('utils') || path.includes('components')
      },
      sync(path) {
        return path.includes('sync') || path.includes('foo') || path.includes('hyphen-name')
      }
    })
  ],
})
