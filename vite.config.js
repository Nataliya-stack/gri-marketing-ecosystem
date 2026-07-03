import { defineConfig } from 'vite';
import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/gri-marketing-ecosystem/',
  plugins: [
    tailwindcss(),
  ],
  build: {
    outDir: 'docs',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        adocat: resolve(__dirname, 'src/adocat/adocat.html'),
        emma: resolve(__dirname, 'src/emma-valera/emma-valera.html'),
        extranjeria: resolve(__dirname, 'src/extranjeria/extranjeria.html'),
        training: resolve(__dirname, 'src/training4you/training4you.html'),
      },
    },
  },
});


