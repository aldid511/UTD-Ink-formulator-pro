import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The app has no API keys or environment configuration: it is a purely
// client-side calculator, so `npm run build` needs no secrets.
export default defineConfig({
  base: './',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
