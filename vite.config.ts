import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/capacity/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('react')) {
            return 'react-vendor';
          }

          if (id.includes('lucide-react')) {
            return 'icon-vendor';
          }

          if (id.includes('motion')) {
            return 'motion-vendor';
          }

          return 'vendor';
        },
      },
    },
  },
});