/**
 * Component Capability Service
 *
 * This service provides a centralized way to query component capabilities
 * without hardcoding component IDs in the core application.
 *
 * Instead of:
 *   if (componentId === 'Repeater' || componentId === 'DataList') { ... }
 *
 * Use:
 *   if (capabilityService.hasDataSource(component)) { ... }
 *
 * This makes the architecture extensible - new components can declare their
 * capabilities in their manifests without requiring core code changes.
 */

import { ComponentManifest, ComponentCapabilities, ComponentInstance } from '../types/builder';
import { useComponentStore } from '../stores/componentStore';

/**
 * Default capabilities based on component category
 * Used as fallback when manifest doesn't specify capabilities
 */
const DEFAULT_CAPABILITIES_BY_CATEGORY: Record<string, Partial<ComponentCapabilities>> = {
  layout: {
    canHaveChildren: true,
    isContainer: true,
    autoHeight: true,
    isResizable: true,
    supportsTemplateBindings: true,
  },
  ui: {
    canHaveChildren: false,
    isContainer: false,
    autoHeight: false,
    isResizable: true,
    supportsTemplateBindings: true,
  },
  data: {
    canHaveChildren: false,
    isContainer: false,
    hasDataSource: false,
    autoHeight: false,
    isResizable: true,
    supportsTemplateBindings: true,
  },
  form: {
    canHaveChildren: false,
    isContainer: false,
    autoHeight: false,
    isResizable: true,
    supportsTemplateBindings: true,
  },
  navbar: {
    canHaveChildren: false,
    isContainer: false,
    autoHeight: false,
    isResizable: true,
    supportsTemplateBindings: true,
  },
  general: {
    canHaveChildren: false,
    isContainer: false,
    autoHeight: false,
    isResizable: true,
    supportsTemplateBindings: true,
  },
};

/**
 * Default capabilities when category is unknown
 */
const DEFAULT_CAPABILITIES: ComponentCapabilities = {
  canHaveChildren: false,
  hasDataSource: false,
  autoHeight: false,
  isContainer: false,
  supportsIteration: false,
  isResizable: true,
  supportsTemplateBindings: true,
};

class ComponentCapabilityService {
  private manifestCache = new Map<string, ComponentManifest | null>();

  /**
   * Get the manifest for a component.
   * Looks up from the componentStore cache (populated from backend registry entries).
   */
  getManifest(pluginId: string, componentId: string): ComponentManifest | null {
    const key = `${pluginId}:${componentId}`;

    // Check local cache first
    if (this.manifestCache.has(key)) {
      return this.manifestCache.get(key) || null;
    }

    // Look up from componentStore (backend-provided manifests)
    const storeState = useComponentStore.getState();
    let manifest = storeState.getManifest(pluginId, componentId);

    // Try matching by componentId alone for virtual plugin compatibility
    if (!manifest) {
      const allCached = storeState.manifestCache;
      for (const [cacheKey, m] of allCached) {
        if (m.componentId === componentId || cacheKey.endsWith(`:${componentId}`)) {
          manifest = m;
          break;
        }
      }
    }

    // Cache the result (even if null to avoid repeated lookups)
    this.manifestCache.set(key, manifest);

    return manifest;
  }

  /**
   * Get capabilities for a component
   * Merges manifest capabilities with category defaults
   */
  getCapabilities(component: ComponentInstance): ComponentCapabilities {
    const manifest = this.getManifest(
      component.pluginId || '',
      component.componentId
    );

    // Start with default capabilities
    const category = (component.componentCategory || manifest?.category || 'general').toLowerCase();
    const categoryDefaults = DEFAULT_CAPABILITIES_BY_CATEGORY[category] || DEFAULT_CAPABILITIES;

    // If manifest has explicit capabilities, use them
    if (manifest?.capabilities) {
      return {
        ...DEFAULT_CAPABILITIES,
        ...categoryDefaults,
        ...manifest.capabilities,
      };
    }

    // Fall back to legacy canHaveChildren field
    if (manifest?.canHaveChildren !== undefined) {
      return {
        ...DEFAULT_CAPABILITIES,
        ...categoryDefaults,
        canHaveChildren: manifest.canHaveChildren,
        isContainer: manifest.canHaveChildren,
      };
    }

    // Use category-based defaults
    return {
      ...DEFAULT_CAPABILITIES,
      ...categoryDefaults,
    };
  }

  /**
   * Check if a component can have children
   * Used for drag-drop functionality
   */
  canHaveChildren(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.canHaveChildren ?? false;
  }

  /**
   * Check if a component is a container (for drag-drop purposes)
   * Layout components and data containers return true
   */
  isContainer(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.isContainer ?? caps.canHaveChildren ?? false;
  }

  /**
   * Check if a component supports data source configuration
   * When true, shows Data Source Editor in Properties Panel
   */
  hasDataSource(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.hasDataSource ?? false;
  }

  /**
   * Check if a component should use auto-height
   * Layout components typically auto-size to content
   */
  shouldAutoHeight(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);

    // If explicitly set, use that
    if (caps.autoHeight !== undefined) {
      return caps.autoHeight;
    }

    // Fall back to checking if it's a container
    return caps.isContainer ?? caps.canHaveChildren ?? false;
  }

  /**
   * Check if a component supports data iteration
   * Used for repeater-like components
   */
  supportsIteration(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.supportsIteration ?? false;
  }

  /**
   * Check if a component is resizable
   */
  isResizable(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.isResizable ?? true;
  }

  /**
   * Check if a component supports template bindings
   */
  supportsTemplateBindings(component: ComponentInstance): boolean {
    const caps = this.getCapabilities(component);
    return caps.supportsTemplateBindings ?? true;
  }

  /**
   * Clear the manifest cache
   * Useful when plugins are loaded/unloaded dynamically
   */
  clearCache(): void {
    this.manifestCache.clear();
  }

  /**
   * Register a manifest programmatically
   * Used when plugins load their manifests at runtime
   */
  registerManifest(pluginId: string, componentId: string, manifest: ComponentManifest): void {
    const key = `${pluginId}:${componentId}`;
    this.manifestCache.set(key, manifest);
  }
}

// Export singleton instance
export const capabilityService = new ComponentCapabilityService();

// Also export the class for testing
export { ComponentCapabilityService };
