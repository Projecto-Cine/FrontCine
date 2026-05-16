/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/i18n/en.js',
        'src/i18n/es.js',
        'src/services/mock/**',
        'src/services/backendModel.js',
        'src/App.jsx',
      ],
    },
  },
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
