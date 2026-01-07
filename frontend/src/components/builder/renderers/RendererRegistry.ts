import React from 'react';
import { ComponentInstance } from '../../../types/builder';

/**
 * Renderer component props interface
 * All renderer components (both core and plugin) must accept these props
 */
export interface RendererProps {
  component: ComponentInstance;
  isEditMode: boolean;
}

export type RendererComponent = React.FC<RendererProps>;

/**
 * Navigation item with multi-level support
 */
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  children?: NavItem[];
}

/**
 * Registry key format: "pluginId:componentId" or just "componentId" for core components
 */
type RendererKey = string;

/**
 * RendererRegistry - Central registry for component renderers
 *
 * This registry allows:
 * 1. Core renderers to be auto-discovered from *Renderer.tsx files
 * 2. Plugin renderers to register themselves at runtime via registerRenderer()
 * 3. Dynamic loading of plugin renderers from remote bundles
 *
 * Plugin developers use this to register their custom renderers without
 * modifying the core framework code.
 */
class RendererRegistryClass {
  private renderers: Map<RendererKey, RendererComponent> = new Map();
  private loadingPromises: Map<RendererKey, Promise<RendererComponent | null>> = new Map();

  /**
   * Register a renderer component
   *
   * @param componentId - The component ID (e.g., "Button", "Input")
   * @param renderer - The React component that renders this component type
   * @param pluginId - Optional plugin ID for plugin-specific renderers
   *
   * @example
   * // Core renderer (no pluginId)
   * RendererRegistry.register('Button', ButtonRenderer);
   *
   * // Plugin renderer (with pluginId)
   * RendererRegistry.register('CustomCard', CustomCardRenderer, 'my-plugin');
   */
  register(componentId: string, renderer: RendererComponent, pluginId?: string): void {
    // Normalize componentId to ensure consistent lookup
    const normalizedComponentId = this.normalizeComponentId(componentId);
    const key = this.buildKey(normalizedComponentId, pluginId);
    this.renderers.set(key, renderer);
    console.log(`[RendererRegistry] Registered renderer: ${key}`);
  }

  /**
   * Unregister a renderer (useful when a plugin is unloaded)
   */
  unregister(componentId: string, pluginId?: string): void {
    // Normalize componentId to ensure consistent lookup
    const normalizedComponentId = this.normalizeComponentId(componentId);
    const key = this.buildKey(normalizedComponentId, pluginId);
    this.renderers.delete(key);
    this.loadingPromises.delete(key);
    console.log(`[RendererRegistry] Unregistered renderer: ${key}`);
  }

  /**
   * Get a renderer for a component
   * First checks for plugin-specific renderer, then falls back to generic renderer
   * Lookup is case-insensitive for componentId
   *
   * @param componentId - The component ID
   * @param pluginId - The plugin ID (from ComponentInstance)
   */
  get(componentId: string, pluginId?: string): RendererComponent | null {
    // Normalize componentId to handle case differences (e.g., "button" vs "Button")
    const normalizedComponentId = this.normalizeComponentId(componentId);

    // First, try plugin-specific renderer (pluginId:componentId)
    if (pluginId) {
      const pluginKey = this.buildKey(normalizedComponentId, pluginId);
      const pluginRenderer = this.renderers.get(pluginKey);
      if (pluginRenderer) {
        return pluginRenderer;
      }
    }

    // Fall back to generic renderer (just componentId)
    const genericKey = this.buildKey(normalizedComponentId);
    return this.renderers.get(genericKey) || null;
  }

  /**
   * Normalize componentId for case-insensitive lookup
   * Converts to PascalCase (e.g., "button" -> "Button", "my-button" -> "MyButton")
   * Preserves existing PascalCase (e.g., "NavbarDefault" stays "NavbarDefault")
   */
  private normalizeComponentId(componentId: string): string {
    // If it contains hyphens or underscores, convert to PascalCase
    if (componentId.includes('-') || componentId.includes('_')) {
      return componentId
        .split(/[-_]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join('');
    }
    // Otherwise, just ensure first letter is uppercase (preserve existing casing)
    return componentId.charAt(0).toUpperCase() + componentId.slice(1);
  }

  /**
   * Check if a renderer exists
   * Lookup is case-insensitive for componentId
   */
  has(componentId: string, pluginId?: string): boolean {
    return this.get(componentId, pluginId) !== null;
  }

  /**
   * Debug: Get all registered renderer keys
   */
  debugGetAllKeys(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Load a renderer dynamically from a remote bundle URL
   * This is used for plugin renderers that are loaded on-demand
   *
   * @param componentId - The component ID
   * @param bundleUrl - URL to the plugin's React bundle
   * @param pluginId - The plugin ID
   */
  async loadFromBundle(
    componentId: string,
    bundleUrl: string,
    pluginId: string
  ): Promise<RendererComponent | null> {
    // Normalize componentId to ensure consistent lookup
    const normalizedComponentId = this.normalizeComponentId(componentId);
    const key = this.buildKey(normalizedComponentId, pluginId);

    // Check if already loaded
    if (this.renderers.has(key)) {
      return this.renderers.get(key)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!;
    }

    // Start loading
    const loadPromise = this.loadBundle(normalizedComponentId, bundleUrl, pluginId);
    this.loadingPromises.set(key, loadPromise);

    try {
      const renderer = await loadPromise;
      if (renderer) {
        this.renderers.set(key, renderer);
      }
      return renderer;
    } finally {
      this.loadingPromises.delete(key);
    }
  }

  /**
   * Internal: Load a bundle and extract the renderer
   */
  private async loadBundle(
    componentId: string,
    bundleUrl: string,
    pluginId: string
  ): Promise<RendererComponent | null> {
    try {
      // Dynamic import of the bundle
      // The bundle should export the component as default or named export
      const module = await import(/* @vite-ignore */ bundleUrl);

      // Try to get the renderer from the module
      const renderer = module.default || module[componentId] || module.Renderer;

      if (typeof renderer === 'function') {
        console.log(`[RendererRegistry] Loaded renderer from bundle: ${pluginId}:${componentId}`);
        return renderer as RendererComponent;
      }

      console.warn(`[RendererRegistry] No valid renderer found in bundle: ${bundleUrl}`);
      return null;
    } catch (error) {
      console.error(`[RendererRegistry] Failed to load bundle: ${bundleUrl}`, error);
      return null;
    }
  }

  /**
   * Get all registered renderer keys (for debugging)
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.renderers.keys());
  }

  /**
   * Clear all registered renderers (useful for testing)
   */
  clear(): void {
    this.renderers.clear();
    this.loadingPromises.clear();
  }

  /**
   * Unregister all renderers from a specific plugin
   * Used when reloading a plugin to ensure fresh renderers are registered
   */
  unregisterByPlugin(pluginId: string): void {
    const keysToRemove: string[] = [];

    for (const key of this.renderers.keys()) {
      // Keys are in format "pluginId:componentId" or just "componentId"
      if (key.startsWith(`${pluginId}:`)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.renderers.delete(key);
      this.loadingPromises.delete(key);
    });

    console.log(`[RendererRegistry] Unregistered ${keysToRemove.length} renderers for plugin: ${pluginId}`);
  }

  /**
   * Build a registry key from componentId and optional pluginId
   */
  private buildKey(componentId: string, pluginId?: string): RendererKey {
    return pluginId ? `${pluginId}:${componentId}` : componentId;
  }
}

// Export singleton instance
export const RendererRegistry = new RendererRegistryClass();

// Also export the class for testing
export { RendererRegistryClass };
