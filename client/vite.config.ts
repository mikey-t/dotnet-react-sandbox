import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

function parseHostname(url: string | undefined) {
  if (!url) {
    throw new Error('Missing url')
  }
  try {
    const urlWithProtocol = /^https?:\/\//i.test(url) ? url : 'http://' + url
    const urlObj = new URL(urlWithProtocol)
    return urlObj.hostname
  } catch (err) {
    throw new Error(`Could not parse url: ${url}`)
  }
}

// https://vitejs.dev/config/
export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }
  const hostname = parseHostname(process.env.SITE_URL)
  const clientPort = parseInt(process.env.DEV_CLIENT_PORT)
  const serverPort = parseInt(process.env.DEV_SERVER_PORT)
  const devCertName = `${hostname}.pfx`

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
      host: hostname,
      https: {
        pfx: fs.readFileSync(`../cert/${devCertName}`)
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
