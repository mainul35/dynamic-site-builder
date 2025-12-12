import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    // Output directory - Spring Boot will copy from here
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    // Clear output directory before build
    emptyOutDir: true,
  },
  
  // Development server configuration
  server: {
    port: 5173,
    // Proxy API requests to Spring Boot during development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  
  // Base path for assets
  base: './',
})