import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Vite configuration for building the navbar-component-plugin frontend bundle.
 *
 * This builds a library bundle that:
 * 1. Exports all component renderers
 * 2. Treats React as an external (provided by host app)
 * 3. Outputs to ../src/main/resources/frontend/ so it's included in the JAR
 */
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to Maven resources directory so it's bundled in the JAR
    outDir: resolve(__dirname, '../src/main/resources/frontend'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'NavbarComponentPlugin',
      // Use IIFE format for browser compatibility - ES modules can't resolve external imports
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      // React is provided by the host application as globals
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        // Map externals to global variables (React is exposed by host app)
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        // Extend window with the plugin
        extend: true,
        // Use named exports for IIFE
        exports: 'named',
        // Single CSS file
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'bundle.css';
          }
          return assetInfo.name || 'asset';
        },
      },
    },
    // Generate source maps for debugging
    sourcemap: true,
    // Use esbuild for minification (terser requires separate install)
    minify: 'esbuild',
  },
  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
