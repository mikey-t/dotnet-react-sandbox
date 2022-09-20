import {loadEnv} from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vitejs.dev/config/
export default ({mode}) => {
  process.env = {...process.env, ...loadEnv(mode, process.cwd(), '')};
  const clientPort = parseInt(process.env.DEV_CLIENT_PORT)
  const serverPort = parseInt(process.env.DEV_SERVER_PORT)
  
  return {
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
