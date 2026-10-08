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
    pool: 'threads',
    // Vitest 4 eliminó poolOptions: ahora estas opciones van al nivel superior.
    // Con la forma antigua la configuración se ignoraba en silencio y cada
    // ejecución avisaba del cambio.
    minWorkers: 1,
    maxWorkers: 2,
    testTimeout: 15_000,
    hookTimeout: 15_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      clean: true,
      cleanOnRerun: true,
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
    open: '/login',
    proxy: {
      '/api': {
        // Force IPv4 (127.0.0.1) instead of "localhost" — on Windows the latter
        // resolves to BOTH ::1 and 127.0.0.1 and Node's proxy then emits an
        // AggregateError listing every failed attempt, which is confusing.
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
        timeout:      10_000, // 10 s ceiling per request
        proxyTimeout: 10_000,
        // Friendly error handler so the dev terminal does NOT dump a stack
        // trace every time the backend is down — it just prints a one-liner
        // and returns a 503 with JSON the frontend can parse.
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            const isConnRefused = err.code === 'ECONNREFUSED' || /ECONNREFUSED/.test(String(err));
            if (isConnRefused) {
              // eslint-disable-next-line no-console
              console.warn('[vite proxy] Backend no disponible en http://127.0.0.1:8080 — arranca `./mvnw spring-boot:run`');
            } else {
              // eslint-disable-next-line no-console
              console.warn('[vite proxy]', err.code ?? 'error', err.message ?? err);
            }
            if (res && !res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 503,
                error:  'Backend no disponible',
                message: 'No se pudo conectar con http://127.0.0.1:8080. Arranca el backend con `./mvnw spring-boot:run`.',
              }));
            }
          });
        },
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
