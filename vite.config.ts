import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Use relative paths for assets - fixes Vercel deployment
  envPrefix: ['VITE_', 'PUBLIC_HEATSEEKER_'],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    // Optimize for production
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  }
})
