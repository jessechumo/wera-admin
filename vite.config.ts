import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The app calls relative /api and /healthz: proxied to `wera serve` in dev
// (:8080 unless WERA_API says otherwise) and by nginx in production.
const api = process.env.WERA_API ?? 'http://localhost:8080';
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __APP_COMMIT__: JSON.stringify((process.env.APP_COMMIT ?? 'dev').slice(0, 7)),
  },
  server: {
    // 5173 is the dashboard's dev server.
    port: 5175,
    proxy: {
      '/api': api,
      '/healthz': api,
    },
  },
});
