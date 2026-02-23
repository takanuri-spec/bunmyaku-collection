import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // API_PORT (.env.{mode}) → バックエンドサーバーへのプロキシ先
  const apiPort = parseInt(env.API_PORT ?? env.PORT ?? '3001')

  // PORT (process.env から) → Vite 自身のサーバーポート
  // preview_start がここに割り当てポートを注入する
  const serverPort = parseInt(process.env.PORT ?? env.PORT ?? '5173')

  return {
    plugins: [react()],
    server: {
      port: serverPort,
      proxy: {
        '/api': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/gemini': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/cross-lang': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
        '/parse-file': {
          target: `http://localhost:${apiPort}`,
          changeOrigin: true,
        },
      },
    },
  }
})
