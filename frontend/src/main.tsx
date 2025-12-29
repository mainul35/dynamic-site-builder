import React from 'react'
import ReactDOM from 'react-dom/client'
import { jsx, jsxs, Fragment } from 'react/jsx-runtime'
import App from './App.tsx'
import './index.css'

// Expose React and ReactDOM globally for plugin IIFE bundles
// Plugins are built as IIFE format and expect these to be available on window
(window as unknown as Record<string, unknown>).React = React;
(window as unknown as Record<string, unknown>).ReactDOM = ReactDOM;

// Expose JSX runtime for plugins using automatic JSX transform
// The jsx-runtime provides jsx, jsxs, and Fragment functions
// IMPORTANT: jsxRuntime must have jsx and jsxs functions for plugin IIFE bundles
// We explicitly construct the object to ensure the functions are properly exposed
const jsxRuntimeObj = { jsx, jsxs, Fragment };
(window as unknown as Record<string, unknown>).jsxRuntime = jsxRuntimeObj;
// Also set on globalThis for broader compatibility
(globalThis as unknown as Record<string, unknown>).jsxRuntime = jsxRuntimeObj;

// Debug: verify jsxRuntime is set correctly
console.log('[main.tsx] jsxRuntime set:', {
  jsx: typeof jsx,
  jsxs: typeof jsxs,
  Fragment: typeof Fragment,
  windowJsxRuntime: (window as unknown as Record<string, unknown>).jsxRuntime,
  globalThisJsxRuntime: (globalThis as unknown as Record<string, unknown>).jsxRuntime,
});

// Suppress findDOMNode deprecation warning from react-quill
// This is a known issue with react-quill and React 18 StrictMode
// See: https://github.com/zenoamaro/react-quill/issues/122
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('findDOMNode')
  ) {
    return;
  }
  originalError.call(console, ...args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)