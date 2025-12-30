/**
 * Plugin Loader Service
 *
 * This service handles loading plugin frontend bundles from the backend API.
 * When a plugin is loaded, its renderers are automatically registered
 * with the RendererRegistry.
 *
 * Bundles are loaded as IIFE scripts that expose themselves on window globals.
 */

import { RendererRegistry, RendererComponent } from '../components/builder/renderers/RendererRegistry';

/**
 * Plugin bundle structure expected from dynamically loaded plugins
 */
interface PluginBundle {
  pluginId: string;
  renderers: Record<string, RendererComponent>;
  version?: string;
  registerRenderers?: (registry: typeof RendererRegistry) => void;
}

/**
 * Plugin frontend info from backend API
 */
interface PluginFrontendInfo {
  pluginId: string;
  hasBundleJs: boolean;
  hasBundleCss: boolean;
}

/**
 * Tracks which plugins have been loaded
 */
const loadedPlugins = new Set<string>();
const loadingPlugins = new Map<string, Promise<boolean>>();

/**
 * Base URL for plugin assets API
 */
const PLUGIN_API_BASE = '/api/plugins';

/**
 * Maps plugin IDs to their global variable names (used by IIFE bundles)
 */
const PLUGIN_GLOBAL_NAMES: Record<string, string> = {
  'navbar-component-plugin': 'NavbarComponentPlugin',
  'label-component-plugin': 'LabelComponentPlugin',
  'button-component-plugin': 'ButtonComponentPlugin',
  'textbox-component-plugin': 'TextboxComponentPlugin',
  'container-layout-plugin': 'ContainerLayoutPlugin',
  'scrollable-container-plugin': 'ScrollableContainerPlugin',
  'image-component-plugin': 'ImageComponentPlugin',
  'auth-component-plugin': 'AuthComponentPlugin',
};

/**
 * Virtual plugin IDs that map to multiple actual plugins
 * When 'core-ui' is requested, all these plugins will be loaded
 */
const VIRTUAL_PLUGIN_MAPPINGS: Record<string, string[]> = {
  'core-ui': [
    'label-component-plugin',
    'button-component-plugin',
    'container-layout-plugin',
    'textbox-component-plugin',
    'image-component-plugin',
  ],
  'core-navbar': [
    'navbar-component-plugin',
  ],
};

/**
 * Maps componentId to the actual plugin that provides it
 * Used for registering renderers under alias plugin IDs
 */
const COMPONENT_TO_PLUGIN_MAPPING: Record<string, string> = {
  'Label': 'label-component-plugin',
  'Button': 'button-component-plugin',
  'Container': 'container-layout-plugin',
  'Textbox': 'textbox-component-plugin',
  'Image': 'image-component-plugin',
};

/**
 * Get the global variable name for a plugin
 */
function getPluginGlobalName(pluginId: string): string {
  // Check predefined mapping first
  if (PLUGIN_GLOBAL_NAMES[pluginId]) {
    return PLUGIN_GLOBAL_NAMES[pluginId];
  }
  // Convert plugin-id to PascalCase (e.g., "my-plugin" -> "MyPlugin")
  return pluginId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

/**
 * Check if a plugin has frontend assets available
 */
export async function checkPluginFrontend(pluginId: string): Promise<PluginFrontendInfo | null> {
  try {
    const response = await fetch(`${PLUGIN_API_BASE}/${pluginId}/has-frontend`);
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn(`[PluginLoader] Failed to check frontend for ${pluginId}:`, error);
    return null;
  }
}

/**
 * Load a plugin's CSS styles
 */
async function loadPluginStyles(pluginId: string): Promise<void> {
  const styleId = `plugin-styles-${pluginId}`;

  // Check if already loaded
  if (document.getElementById(styleId)) {
    return;
  }

  const link = document.createElement('link');
  link.id = styleId;
  link.rel = 'stylesheet';
  link.href = `${PLUGIN_API_BASE}/${pluginId}/bundle.css`;

  return new Promise((resolve, reject) => {
    link.onload = () => {
      console.log(`[PluginLoader] Loaded styles for ${pluginId}`);
      resolve();
    };
    link.onerror = () => {
      // CSS is optional, don't fail if not found
      console.debug(`[PluginLoader] No styles found for ${pluginId}`);
      resolve();
    };
    document.head.appendChild(link);
  });
}

/**
 * Load a plugin's JavaScript bundle via script injection and register its renderers.
 * IIFE bundles expose themselves on window globals (e.g., window.NavbarComponentPlugin).
 */
async function loadPluginBundle(pluginId: string): Promise<boolean> {
  try {
    const bundleUrl = `${PLUGIN_API_BASE}/${pluginId}/bundle.js`;
    const globalName = getPluginGlobalName(pluginId);

    // Verify jsxRuntime is available before loading the bundle
    const jsxRuntimeCheck = (window as Record<string, unknown>).jsxRuntime as Record<string, unknown>;
    console.log(`[PluginLoader] jsxRuntime check before loading ${pluginId}:`, {
      exists: !!jsxRuntimeCheck,
      hasJsx: typeof jsxRuntimeCheck?.jsx,
      hasJsxs: typeof jsxRuntimeCheck?.jsxs,
      keys: jsxRuntimeCheck ? Object.keys(jsxRuntimeCheck) : [],
    });

    if (!jsxRuntimeCheck?.jsx || typeof jsxRuntimeCheck.jsx !== 'function') {
      console.error(`[PluginLoader] ERROR: jsxRuntime.jsx is not available! Plugin ${pluginId} will fail.`);
      console.error('[PluginLoader] Current window.jsxRuntime:', jsxRuntimeCheck);
    }

    // Load bundle via script tag injection (for IIFE format)
    // Add cache-busting query param to force fresh load during development
    const cacheBuster = import.meta.env.DEV ? `?t=${Date.now()}` : '';
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = bundleUrl + cacheBuster;
      script.id = `plugin-script-${pluginId}`;
      script.async = true;

      script.onload = () => {
        console.log(`[PluginLoader] Script loaded for ${pluginId}`);
        resolve();
      };

      script.onerror = () => {
        reject(new Error(`Failed to load script for ${pluginId}`));
      };

      document.head.appendChild(script);
    });

    // Get the plugin from the global variable
    const pluginBundle: PluginBundle = (window as Record<string, unknown>)[globalName] as PluginBundle;

    if (!pluginBundle) {
      console.warn(`[PluginLoader] Plugin global not found: window.${globalName}`);
      return false;
    }

    if (!pluginBundle.renderers && !pluginBundle.registerRenderers) {
      console.warn(`[PluginLoader] Invalid bundle format for ${pluginId}: no renderers found`);
      return false;
    }

    // If the plugin exports a registerRenderers function, use it
    if (typeof pluginBundle.registerRenderers === 'function') {
      pluginBundle.registerRenderers(RendererRegistry);
    }
    // Otherwise, register renderers manually
    else if (pluginBundle.renderers) {
      Object.entries(pluginBundle.renderers).forEach(([componentId, renderer]) => {
        RendererRegistry.register(componentId, renderer, pluginBundle.pluginId || pluginId);
      });
    }

    console.log(
      `[PluginLoader] Loaded bundle for ${pluginId}:`,
      Object.keys(pluginBundle.renderers || {})
    );

    return true;
  } catch (error) {
    console.error(`[PluginLoader] Failed to load bundle for ${pluginId}:`, error);
    return false;
  }
}

/**
 * Load a plugin's frontend assets (both JS and CSS)
 *
 * @param pluginId The plugin ID to load
 * @returns true if the plugin was loaded successfully
 */
export async function loadPlugin(pluginId: string): Promise<boolean> {
  // Check if already loaded
  if (loadedPlugins.has(pluginId)) {
    return true;
  }

  // Check if currently loading
  if (loadingPlugins.has(pluginId)) {
    return loadingPlugins.get(pluginId)!;
  }

  // Check if this is a virtual plugin (maps to multiple actual plugins)
  if (VIRTUAL_PLUGIN_MAPPINGS[pluginId]) {
    const actualPluginIds = VIRTUAL_PLUGIN_MAPPINGS[pluginId];
    console.log(`[PluginLoader] Loading virtual plugin ${pluginId} -> [${actualPluginIds.join(', ')}]`);

    const loadPromise = (async () => {
      try {
        // Load all actual plugins that make up this virtual plugin
        const results = await Promise.all(
          actualPluginIds.map(async (actualPluginId) => {
            const success = await loadActualPlugin(actualPluginId);
            if (success) {
              // Also register renderers under the virtual plugin ID
              registerRenderersUnderAlias(actualPluginId, pluginId);
            }
            return success;
          })
        );

        // Consider virtual plugin loaded if at least one actual plugin loaded
        const anyLoaded = results.some(Boolean);
        if (anyLoaded) {
          loadedPlugins.add(pluginId);
        }
        return anyLoaded;
      } finally {
        loadingPlugins.delete(pluginId);
      }
    })();

    loadingPlugins.set(pluginId, loadPromise);
    return loadPromise;
  }

  // Regular plugin loading
  return loadActualPlugin(pluginId);
}

/**
 * Load an actual (non-virtual) plugin's frontend assets
 */
async function loadActualPlugin(pluginId: string): Promise<boolean> {
  // Check if already loaded
  if (loadedPlugins.has(pluginId)) {
    return true;
  }

  // Check if currently loading
  if (loadingPlugins.has(pluginId)) {
    return loadingPlugins.get(pluginId)!;
  }

  // Start loading
  const loadPromise = (async () => {
    try {
      // First check if the plugin has frontend assets
      const frontendInfo = await checkPluginFrontend(pluginId);

      if (!frontendInfo || !frontendInfo.hasBundleJs) {
        console.debug(`[PluginLoader] Plugin ${pluginId} has no frontend bundle`);
        return false;
      }

      // Load CSS first (parallel with JS would cause FOUC)
      if (frontendInfo.hasBundleCss) {
        await loadPluginStyles(pluginId);
      }

      // Load JavaScript bundle
      const success = await loadPluginBundle(pluginId);

      if (success) {
        loadedPlugins.add(pluginId);
      }

      return success;
    } finally {
      loadingPlugins.delete(pluginId);
    }
  })();

  loadingPlugins.set(pluginId, loadPromise);
  return loadPromise;
}

/**
 * Register renderers from one plugin under an alias plugin ID
 * This allows components with pluginId='core-ui' to find renderers registered by 'label-component-plugin'
 */
function registerRenderersUnderAlias(actualPluginId: string, aliasPluginId: string): void {
  // Find components provided by this plugin
  const componentsFromPlugin = Object.entries(COMPONENT_TO_PLUGIN_MAPPING)
    .filter(([_, plugin]) => plugin === actualPluginId)
    .map(([component]) => component);

  componentsFromPlugin.forEach((componentId) => {
    const renderer = RendererRegistry.get(componentId, actualPluginId);
    if (renderer) {
      RendererRegistry.register(componentId, renderer, aliasPluginId);
      console.log(`[PluginLoader] Registered ${componentId} under alias ${aliasPluginId}`);
    }
  });
}

/**
 * Load multiple plugins in parallel
 *
 * @param pluginIds Array of plugin IDs to load
 * @returns Map of pluginId to success status
 */
export async function loadPlugins(pluginIds: string[]): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  await Promise.all(
    pluginIds.map(async (pluginId) => {
      const success = await loadPlugin(pluginId);
      results.set(pluginId, success);
    })
  );

  return results;
}

/**
 * Unload a plugin's frontend assets
 *
 * @param pluginId The plugin ID to unload
 */
export function unloadPlugin(pluginId: string): void {
  // Remove styles
  const styleElement = document.getElementById(`plugin-styles-${pluginId}`);
  if (styleElement) {
    styleElement.remove();
  }

  // Remove script tag
  const scriptElement = document.getElementById(`plugin-script-${pluginId}`);
  if (scriptElement) {
    scriptElement.remove();
  }

  // Clean up global variable
  const globalName = getPluginGlobalName(pluginId);
  delete (window as Record<string, unknown>)[globalName];

  loadedPlugins.delete(pluginId);

  console.log(`[PluginLoader] Unloaded plugin ${pluginId}`);
}

/**
 * Check if a plugin is loaded
 */
export function isPluginLoaded(pluginId: string): boolean {
  return loadedPlugins.has(pluginId);
}

/**
 * Get list of loaded plugins
 */
export function getLoadedPlugins(): string[] {
  return Array.from(loadedPlugins);
}

/**
 * Preload plugins that are likely to be needed
 * This can be called early to reduce loading delays later
 *
 * @param pluginIds Plugin IDs to preload
 */
export function preloadPlugins(pluginIds: string[]): void {
  pluginIds.forEach((pluginId) => {
    if (!loadedPlugins.has(pluginId) && !loadingPlugins.has(pluginId)) {
      // Start loading but don't wait for it
      loadPlugin(pluginId).catch(() => {
        // Ignore preload failures
      });
    }
  });
}

/**
 * Load all available plugin bundles
 * Fetches the component registry and loads all plugins that have frontends
 */
export async function loadAllPlugins(): Promise<Map<string, boolean>> {
  try {
    // Fetch list of available plugins from the component registry
    const response = await fetch('/api/component-registry');
    if (!response.ok) {
      throw new Error('Failed to fetch component registry');
    }

    const components = await response.json();

    // Extract unique plugin IDs
    const pluginIds = new Set<string>();
    for (const component of components) {
      if (component.pluginId) {
        pluginIds.add(component.pluginId);
      }
    }

    // Load all plugin bundles
    return loadPlugins(Array.from(pluginIds));
  } catch (error) {
    console.error('[PluginLoader] Failed to load all plugins:', error);
    return new Map();
  }
}

export default {
  loadPlugin,
  loadPlugins,
  loadAllPlugins,
  unloadPlugin,
  isPluginLoaded,
  getLoadedPlugins,
  preloadPlugins,
  checkPluginFrontend,
};
