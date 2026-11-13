import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { lottoApi } from './vite.lotto.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), lottoApi()],
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
