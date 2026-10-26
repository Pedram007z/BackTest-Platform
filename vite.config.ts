import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode artifact` builds a single self-contained HTML file (used for the hosted preview).
export default defineConfig(({ mode }) => {
  const api = loadEnv(mode, process.cwd(), '').VITE_API_URL;
  return {
    plugins: [react(), ...(mode === 'artifact' ? [viteSingleFile()] : [])],
    // absolute paths: pages live at nested addresses (/replay/abc) and load /assets/… from the root
    base: mode === 'artifact' ? './' : '/',
    build: {
      outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
      chunkSizeWarningLimit: 1500,
    },
    // `npm run dev` with an API server: its blog pages, sitemap, robots.txt and the pictures they show (nginx does this in production)
    server: api ? { proxy: { '/blog': api, '/sitemap.xml': api, '/robots.txt': api, '/api/media': api } } : undefined,
  };
});
