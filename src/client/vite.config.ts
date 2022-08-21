import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Disable if CSS parsing is slowing down tests
    css: true,
  },
  server: {
    host: 'local.drs.mikeyt.net',
    https: {
      pfx: fs.readFileSync('../../cert/local.drs.mikeyt.net.pfx')
    },
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/': {
        target: 'https://localhost:5001',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
