import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode artifact` builds a single self-contained HTML file (used for the hosted preview).
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'artifact' ? [viteSingleFile()] : [])],
  // absolute paths: pages live at nested addresses (/replay/abc) and load /assets/… from the root
  base: mode === 'artifact' ? './' : '/',
  build: {
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
    chunkSizeWarningLimit: 1500,
  },
}));
