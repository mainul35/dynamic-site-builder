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
      },
      '/uploads': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/oauth2/authorization': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/login/oauth2': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // Configure to pass through redirects to the browser
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // Log redirect responses for debugging
            if (proxyRes.statusCode && proxyRes.statusCode >= 300 && proxyRes.statusCode < 400) {
              console.log('[Vite Proxy] Redirect detected:', proxyRes.statusCode, proxyRes.headers.location);
            }
          });
        },
      }
    }
  },
  
  // Base path for assets
  base: '/',
})