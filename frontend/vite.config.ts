import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import pkgJson from './package.json';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define:{
    FRONTEND_VERSION: JSON.stringify(pkgJson.version),
  },
  build: {
    outDir: "../webapp/static",
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    proxy: {
      '/api': 'http://localhost:5000'
    }
  }
})
