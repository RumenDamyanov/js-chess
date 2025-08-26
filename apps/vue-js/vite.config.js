import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname workaround for ESM config file
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
  '@shared': path.resolve(__dirname, './shared'), // app-local shared (CSS overrides etc.)
  '@root-shared': path.resolve(__dirname, '../..', 'shared') // repository root shared (design system + assets)
    }
  },
  build: {
    outDir: 'dist'
  },
  server: {
    host: '0.0.0.0',
    port: 3003
  }
})
