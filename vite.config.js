import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_BASE_URL && env.VITE_API_BASE_URL.startsWith('http')
    ? env.VITE_API_BASE_URL.replace(/\/api(\/v1)?\/?$/, '')
    : 'http://127.0.0.1:8000'

  return defineConfig({
    plugins: [react()],
    server: {
      port: Number(env.VITE_DEV_SERVER_PORT || 5173),
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  })
}
