import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Aumenta o limite de aviso para 1600kB (o bundle atual tem ~800kB) para silenciar o alerta
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        // Separa as bibliotecas do código da aplicação (vendor chunk)
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
});