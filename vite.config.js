import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-lotto': {
        target: 'https://www.dhlottery.co.kr',
        changeOrigin: true,
        rewrite: (p) => p.replace('/api-lotto', '/common.do'),
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
