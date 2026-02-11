import React, { useEffect, useState, useMemo } from 'react';
import { ComponentInstance } from '../../../types/builder';
import { RendererRegistry, RendererComponent, RendererProps } from './RendererRegistry';
import { loadPlugin, isPluginLoaded } from '../../../services/pluginLoaderService';
import { useBuilderStore } from '../../../stores/builderStore';

// Re-export types for convenience
export type { RendererProps, RendererComponent };
export { RendererRegistry };

// Expose RendererRegistry globally so plugins can use it to render children
(globalThis as unknown as { RendererRegistry: typeof RendererRegistry }).RendererRegistry = RendererRegistry;

// Also expose loadPlugin function so plugins can trigger loading of other plugins
import { loadPlugin as loadPluginFn } from '../../../services/pluginLoaderService';
(globalThis as unknown as { loadPlugin: typeof loadPluginFn }).loadPlugin = loadPluginFn;

/**
 * Auto-discover and register all core *Renderer.tsx files from this directory
 * Uses Vite's import.meta.glob for convention-based auto-discovery
 *
 * Core renderers follow the naming convention: {ComponentName}Renderer.tsx
 * They are registered WITHOUT a pluginId (generic renderers)
 */
const coreRendererModules = import.meta.glob<{ default: RendererComponent }>(
  ['./*Renderer.tsx', '!./RendererRegistry.ts'],
  { eager: true }
);

// Navbar component renderer names that should be registered with navbar plugins
const NAVBAR_PLUGIN_RENDERERS = [
  'Navbar',
  'NavbarCentered',
  'NavbarMinimal',
  'NavbarDark',
  'NavbarGlass',
  'NavbarSticky',
  'SidebarNav',
  'TopHeaderBar',
];

// Register navbar renderers under both plugin IDs for compatibility
const NAVBAR_PLUGIN_IDS = ['navbar-component-plugin', 'core-navbar'];

// Map of componentId aliases to their actual renderer names
// e.g., 'NavbarDefault' uses the 'Navbar' renderer
const NAVBAR_ALIASES: Record<string, string> = {
  'NavbarDefault': 'Navbar',
};

// Note: Core UI components (Container, Label, Button, Image, Textbox) are provided by their
// respective plugins (container-layout-plugin, label-component-plugin, etc.) and are loaded
// dynamically via pluginLoaderService when 'core-ui' virtual plugin is requested.

// Register all core renderers on module load
for (const path in coreRendererModules) {
  // Extract component name from path: ./ButtonRenderer.tsx -> "Button"
  const match = /\.\/(.+)Renderer\.tsx$/.exec(path);
  if (match) {
    const componentName = match[1];
    const module = coreRendererModules[path];
    if (module.default) {
      // Check if this is a navbar renderer - register with both plugin IDs for compatibility
      if (NAVBAR_PLUGIN_RENDERERS.includes(componentName)) {
        NAVBAR_PLUGIN_IDS.forEach(pluginId => {
          RendererRegistry.register(componentName, module.default, pluginId);
        });

        // Register aliases for this renderer (e.g., NavbarDefault -> Navbar)
        Object.entries(NAVBAR_ALIASES).forEach(([alias, target]) => {
          if (target === componentName) {
            NAVBAR_PLUGIN_IDS.forEach(pluginId => {
              RendererRegistry.register(alias, module.default, pluginId);
            });
          }
        });
      } else {
        // Register as core renderer (no pluginId)
        RendererRegistry.register(componentName, module.default);
      }
    }
  }
}

interface ComponentRendererProps {
  component: ComponentInstance;
  isEditMode: boolean;
}

/**
 * ComponentRenderer - Factory component that renders the appropriate component
 *
 * Resolution order:
 * 1. Plugin-specific renderer (pluginId:componentId)
 * 2. Core renderer (componentId only)
 * 3. Dynamically loaded renderer from bundle URL (if reactBundlePath provided)
 * 4. Fallback placeholder
 */
export const ComponentRenderer: React.FC<ComponentRendererProps> = ({ component, isEditMode }) => {
  const [DynamicRenderer, setDynamicRenderer] = useState<RendererComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to rendererVersion to force re-render when plugins are reloaded
  const rendererVersion = useBuilderStore((state) => state.rendererVersion);

  // Get renderer from registry - useMemo ensures we re-fetch when rendererVersion changes
  const Renderer = useMemo(() => {
    return RendererRegistry.get(component.componentId, component.pluginId);
  }, [component.componentId, component.pluginId, rendererVersion]);

  // When rendererVersion changes (plugin reloaded), clear dynamic renderer to get fresh one
  useEffect(() => {
    if (rendererVersion > 0) {
      setDynamicRenderer(null);
    }
  }, [rendererVersion]);

  // Debug logging for component resolution (commented out - too verbose)
  // if (import.meta.env.DEV) {
  //   console.log('[ComponentRenderer] Lookup:', {
  //     componentId: component.componentId,
  //     pluginId: component.pluginId,
  //     found: !!Renderer,
  //     rendererVersion,
  //     registeredKeys: RendererRegistry.debugGetAllKeys(),
  //   });
  // }

  // If no renderer found, try loading the plugin dynamically
  useEffect(() => {
    if (Renderer || DynamicRenderer) return;

    const { pluginId, componentId } = component;

    // If we have a pluginId, try loading the plugin bundle
    if (pluginId && !isPluginLoaded(pluginId)) {
      setIsLoading(true);
      loadPlugin(pluginId)
        .then((success) => {
          if (success) {
            // After loading, check registry again
            const loadedRenderer = RendererRegistry.get(componentId, pluginId);
            if (loadedRenderer) {
              setDynamicRenderer(() => loadedRenderer);
            }
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
      return;
    }

    // Fallback: Check if component has a direct bundle path for dynamic loading
    const bundlePath = (component as ComponentInstance & { reactBundlePath?: string }).reactBundlePath;

    if (bundlePath && pluginId) {
      setIsLoading(true);
      RendererRegistry.loadFromBundle(componentId, bundlePath, pluginId)
        .then((loadedRenderer) => {
          if (loadedRenderer) {
            setDynamicRenderer(() => loadedRenderer);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [component.componentId, component.pluginId, Renderer, DynamicRenderer]);

  // Use found renderer
  const FinalRenderer = Renderer || DynamicRenderer;

  if (FinalRenderer) {
    // Use rendererVersion in key to force remount when plugin is reloaded
    return <FinalRenderer key={`${component.instanceId}-v${rendererVersion}`} component={component} isEditMode={isEditMode} />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="renderer-loading" style={{
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        border: '1px dashed #dee2e6',
        borderRadius: '4px',
        textAlign: 'center',
        color: '#6c757d',
        fontSize: '12px'
      }}>
        Loading {component.componentId}...
      </div>
    );
  }

  // Fallback: render a placeholder for unknown components
  return (
    <div className="unknown-component-placeholder" style={{
      padding: '8px 12px',
      backgroundColor: '#f0f0f0',
      border: '1px dashed #ccc',
      borderRadius: '4px',
      textAlign: 'center',
      color: '#666',
      fontSize: '12px'
    }}>
      {component.componentId}
      {component.pluginId && (
        <span style={{ fontSize: '10px', display: 'block', opacity: 0.7 }}>
          ({component.pluginId})
        </span>
      )}
    </div>
  );
};

export default ComponentRenderer;
