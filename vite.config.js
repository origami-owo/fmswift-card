import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: './',
  plugins: [vue()],
  server: {
    proxy: {
      '/api/cards': {
        target: 'https://storage.my-api.cn',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api\/cards/, '/static/images/Cards')
      }
    }
  }
})
