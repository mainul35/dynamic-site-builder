import React, { useEffect, useState } from 'react';
import { ComponentInstance } from '../../../types/builder';
import { RendererRegistry, RendererComponent, RendererProps } from './RendererRegistry';

// Re-export types for convenience
export type { RendererProps, RendererComponent };
export { RendererRegistry };

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

// Register all core renderers on module load
for (const path in coreRendererModules) {
  // Extract component name from path: ./ButtonRenderer.tsx -> "Button"
  const match = /\.\/(.+)Renderer\.tsx$/.exec(path);
  if (match) {
    const componentName = match[1];
    const module = coreRendererModules[path];
    if (module.default) {
      // Register as core renderer (no pluginId)
      RendererRegistry.register(componentName, module.default);
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

  // Try to get renderer from registry
  const Renderer = RendererRegistry.get(component.componentId, component.pluginId);

  // Debug logging (remove in production)
  if (import.meta.env.DEV) {
    console.log('[ComponentRenderer] Lookup:', {
      componentId: component.componentId,
      pluginId: component.pluginId,
      found: !!Renderer,
      registeredKeys: RendererRegistry.debugGetAllKeys(),
    });
  }

  // If no renderer found and we have a bundle path, try dynamic loading
  useEffect(() => {
    if (Renderer || DynamicRenderer) return;

    // Check if component has a bundle path for dynamic loading
    // This would come from ComponentRegistryEntry.reactBundlePath
    const bundlePath = (component as any).reactBundlePath;

    if (bundlePath && component.pluginId) {
      setIsLoading(true);
      RendererRegistry.loadFromBundle(component.componentId, bundlePath, component.pluginId)
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
    return <FinalRenderer component={component} isEditMode={isEditMode} />;
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
