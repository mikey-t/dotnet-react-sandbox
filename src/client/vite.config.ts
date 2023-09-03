import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const clientPort = parseInt(process.env.DEV_CLIENT_PORT)
  const serverPort = parseInt(process.env.DEV_SERVER_PORT)
  const devCertName = process.env.DEV_CERT_NAME
  const siteUrlWithPort = process.env.SITE_URL
  const host = siteUrlWithPort.substring(0, siteUrlWithPort.indexOf(':'))

  return {
    plugins: [react()],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      // Disable if CSS parsing is slowing down tests
      css: true,
    },
    server: {
      host: host,
      https: {
        pfx: fs.readFileSync(`../../cert/${devCertName}`)
      },
      port: clientPort,
      strictPort: true,
      proxy: {
        '/api/': {
          target: `https://localhost:${serverPort}`,
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
}
