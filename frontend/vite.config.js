import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    base: '/',
    ssr: {
        // Bundle everything into the SSR entry so the prerender script needs no node_modules resolution tricks.
        noExternal: true,
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        minify: 'esbuild',
        target: 'es2015',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
                        return 'react-vendor';
                    }
                    if (id.includes('node_modules/gsap/')) {
                        return 'gsap-vendor';
                    }
                    if (id.includes('node_modules/lenis/') || id.includes('node_modules/@barba/core/')) {
                        return 'animation-vendor';
                    }
                }
            }
        }
    },
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    }
});
