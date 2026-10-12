import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{ find: /^onnxruntime-web$/, replacement: 'onnxruntime-web/wasm' }],
  },
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 12000,
    assetsInlineLimit: 0,
  },
  optimizeDeps: { exclude: ['onnxruntime-web'] },
  server: { host: true },
})
