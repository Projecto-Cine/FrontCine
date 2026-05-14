import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
  },
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('react-router-dom')) return 'vendor-react';
          if (id.includes('@stripe'))      return 'vendor-stripe';
          if (id.includes('recharts'))     return 'vendor-charts';
          if (id.includes('lucide-react') || id.includes('qrcode.react')) return 'vendor-ui';
        },
      },
    },
  },
})
