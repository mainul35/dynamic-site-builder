import React, { useState, useEffect, useMemo } from 'react';
import type { RendererProps, ComponentInstance, DataSourceConfig, DataContext } from '../types';
import { resolveTemplateVariables } from '../services/templateService';

/**
 * RepeaterRenderer - Iterates over an array and renders children for each item
 *
 * Features:
 * - Fetches data from configured data source (component.dataSource)
 * - Clones children for each item in the array
 * - Resolves template variables like {{item.name}} in child props
 * - Supports multiple layout types (flex-column, flex-row, grid)
 * - Shows empty state when no items
 *
 * Data Source Configuration (from component.dataSource):
 * - type: 'api' | 'static' | 'context'
 * - endpoint: API URL for 'api' type
 * - staticData: Array for 'static' type
 *
 * Props:
 * - itemAlias: string - Variable name for current item (default: "item")
 * - indexAlias: string - Variable name for index (default: "index")
 * - dataPath: string - Path to array in fetched data (default: "" = root)
 * - emptyMessage: string - Message when no items
 * - layoutType: string - flex-column, flex-row, grid-2col, grid-3col, grid-4col
 * - gap: string - Gap between items
 */

interface RepeaterData {
  items: unknown[];
  loading: boolean;
  error: string | null;
}

const RepeaterRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [data, setData] = useState<RepeaterData>({
    items: [],
    loading: false,
    error: null,
  });

  // Extract props with defaults
  const {
    itemAlias = 'item',
    indexAlias = 'index',
    dataPath = '',
    emptyMessage = 'No items to display',
    layoutType = 'flex-column',
    gap = '16px',
  } = component.props;

  // Get dataSource from component.dataSource (set by DataSourceEditor)
  // Also check component.props.dataSource for backwards compatibility
  const dataSourceConfig = component.dataSource || component.props.dataSource;

  // Extract iterator config if provided separately
  const iteratorConfig = component.iteratorConfig;

  // Determine the actual values (iteratorConfig takes precedence for backwards compatibility)
  const effectiveDataPath = (iteratorConfig?.dataPath || dataPath) as string;
  const effectiveItemAlias = (iteratorConfig?.itemAlias || itemAlias) as string;
  const effectiveIndexAlias = (iteratorConfig?.indexAlias || indexAlias) as string;

  // Parse dataSource if it's a string
  const parsedDataSource: DataSourceConfig | undefined = useMemo(() => {
    if (!dataSourceConfig) return undefined;
    if (typeof dataSourceConfig === 'string') {
      try {
        return JSON.parse(dataSourceConfig);
      } catch {
        console.warn('Failed to parse dataSource');
        return undefined;
      }
    }
    return dataSourceConfig as DataSourceConfig;
  }, [dataSourceConfig]);

  // Fetch data from data source
  useEffect(() => {
    // Skip data fetching in edit mode - BuilderCanvas handles rendering children
    if (isEditMode) {
      return;
    }

    if (!parsedDataSource) {
      // No data source configured
      setData({ items: [], loading: false, error: null });
      return;
    }

    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let result: unknown;

        switch (parsedDataSource.type) {
          case 'api':
            if (!parsedDataSource.endpoint) {
              throw new Error('API endpoint is required');
            }
            const response = await fetch(parsedDataSource.endpoint, {
              method: parsedDataSource.method || 'GET',
              headers: {
                'Content-Type': 'application/json',
                ...parsedDataSource.headers,
              },
            });
            if (!response.ok) {
              throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            result = await response.json();
            break;

          case 'static':
            result = parsedDataSource.staticData;
            break;

          case 'context':
            // Context data would come from a parent provider
            result = [];
            break;

          default:
            result = [];
        }

        // Extract array from data using path
        let items = result;
        // Only apply dataPath if it's a non-empty string
        if (effectiveDataPath && effectiveDataPath.trim() !== '') {
          const pathParts = effectiveDataPath.split('.');
          for (const part of pathParts) {
            if (items === null || items === undefined) break;
            items = (items as Record<string, unknown>)[part];
          }
        }

        if (!Array.isArray(items)) {
          console.warn('Data at path is not an array:', effectiveDataPath, items);
          items = [];
        }

        setData({ items: items as unknown[], loading: false, error: null });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setData({
          items: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
        });
      }
    };

    fetchData();
  }, [parsedDataSource, effectiveDataPath, isEditMode]);

  // Get layout styles
  const getLayoutStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width: '100%',
      gap: gap as string,
    };

    switch (layoutType) {
      case 'flex-row':
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        };
      case 'grid-2col':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
        };
      case 'grid-3col':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        };
      case 'grid-4col':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        };
      case 'grid-auto':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        };
      case 'flex-column':
      default:
        return {
          ...baseStyles,
          display: 'flex',
          flexDirection: 'column',
        };
    }
  };

  // Create a cloned component with resolved template variables
  const createResolvedComponent = (
    child: ComponentInstance,
    context: DataContext
  ): ComponentInstance => {
    // Resolve template variables in props
    const resolvedProps = resolveTemplateVariables(child.props, context);

    // Recursively resolve children
    const resolvedChildren = child.children?.map((grandchild) =>
      createResolvedComponent(grandchild, context)
    );

    return {
      ...child,
      props: resolvedProps,
      children: resolvedChildren,
    };
  };

  // Get layout styles for nested containers
  const getNestedLayoutStyles = (layoutMode: string = 'flex-column'): React.CSSProperties => {
    switch (layoutMode) {
      case 'flex-row':
        return { display: 'flex', flexDirection: 'row', flexWrap: 'nowrap' };
      case 'flex-wrap':
        return { display: 'flex', flexDirection: 'row', flexWrap: 'wrap' };
      case 'grid-2col':
        return { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' };
      case 'grid-3col':
        return { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' };
      case 'grid-4col':
        return { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' };
      case 'grid-auto':
        return { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' };
      case 'flex-column':
      default:
        return { display: 'flex', flexDirection: 'column' };
    }
  };

  // Render a child component - uses window.RendererRegistry if available
  const renderChildComponent = (
    child: ComponentInstance,
    context: DataContext,
    key: string
  ): React.ReactNode => {
    // Create a new component instance with resolved template variables
    const resolvedChild = createResolvedComponent(child, context);

    // Check if this is a layout component (Container, etc.)
    // Layout components need special handling to render their nested children
    const isLayoutComponent = child.componentCategory?.toLowerCase() === 'layout';

    if (isLayoutComponent && resolvedChild.children && resolvedChild.children.length > 0) {
      // Get layout properties from the resolved child
      const layoutMode = (resolvedChild.props?.layoutMode || resolvedChild.props?.layoutType || 'flex-column') as string;
      const layoutStyles = getNestedLayoutStyles(layoutMode);

      // Get background style - support both solid colors and gradients
      const background = resolvedChild.styles?.background;
      const backgroundColor = resolvedChild.styles?.backgroundColor || '#ffffff';

      // Render the layout container with its children
      return (
        <div
          key={key}
          className="repeater-child-wrapper layout-wrapper"
          style={{
            ...layoutStyles,
            gap: resolvedChild.styles?.gap || '16px',
            padding: (resolvedChild.props?.padding as string) || '20px',
            ...(background ? { background } : { backgroundColor }),
            borderRadius: resolvedChild.styles?.borderRadius || '8px',
            boxShadow: resolvedChild.styles?.boxShadow,
          }}
        >
          {resolvedChild.children.map((grandchild, grandchildIndex) =>
            renderChildComponent(grandchild, context, `${key}-${grandchildIndex}`)
          )}
        </div>
      );
    }

    // Try to use the global RendererRegistry if available (set by main app)
    const globalWithRegistry = globalThis as unknown as {
      RendererRegistry?: {
        get: (componentId: string, pluginId?: string) => React.FC<RendererProps> | null;
      };
    };

    if (globalWithRegistry.RendererRegistry) {
      const Renderer = globalWithRegistry.RendererRegistry.get(child.componentId, child.pluginId);
      if (Renderer) {
        return (
          <div
            key={key}
            className="repeater-child-wrapper"
            style={{
              width: resolvedChild.size?.width || 'auto',
              height: resolvedChild.size?.height || 'auto',
              maxWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            <Renderer component={resolvedChild} isEditMode={false} />
          </div>
        );
      }
    }

    // Fallback: render props as text for unknown components
    return (
      <div
        key={key}
        className="repeater-child"
        style={{
          padding: '8px',
          backgroundColor: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px',
        }}
      >
        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
          {child.componentId}
        </div>
        <div style={{ fontSize: '14px' }}>
          {Object.entries(resolvedChild.props).map(([propKey, propValue]) => (
            <div key={propKey}>
              <strong>{propKey}:</strong> {String(propValue)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render children with item context
  const renderChildren = (item: unknown, index: number) => {
    // Generate a key from keyPath or use index
    const itemKey = iteratorConfig?.keyPath
      ? String(getValueByPath(item, iteratorConfig.keyPath) ?? index)
      : index;

    if (!component.children || component.children.length === 0) {
      // No children - render a simple item representation
      return (
        <div
          key={itemKey}
          style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            border: '1px solid #e0e0e0',
          }}
        >
          {typeof item === 'object' ? (
            <pre style={{ margin: 0, fontSize: '12px' }}>
              {JSON.stringify(item, null, 2)}
            </pre>
          ) : (
            <span>{String(item)}</span>
          )}
        </div>
      );
    }

    // Create context for template variable resolution
    const context: DataContext = {
      [effectiveItemAlias]: item,
      [effectiveIndexAlias]: index,
      item,
      index,
    };

    // Render children with resolved props
    return (
      <div
        key={itemKey}
        className="repeater-item"
        data-index={index}
      >
        {component.children.map((child, childIndex) =>
          renderChildComponent(child, context, `${index}-${childIndex}`)
        )}
      </div>
    );
  };

  // Container styles from component.styles
  const containerStyles: React.CSSProperties = {
    ...getLayoutStyles(),
    backgroundColor: component.styles.backgroundColor || 'transparent',
    padding: component.styles.padding || '0',
    borderRadius: component.styles.borderRadius || '0',
    border: component.styles.border || 'none',
    boxSizing: 'border-box',
    overflow: 'auto',
  };

  // In edit mode, just render the container (BuilderCanvas handles children)
  if (isEditMode) {
    return <div style={containerStyles} className="repeater-container edit-mode" />;
  }

  // Loading state
  if (data.loading) {
    return (
      <div style={{ ...containerStyles, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontStyle: 'italic' }}>Loading...</div>
      </div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <div style={{ ...containerStyles, alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#dc3545', padding: '16px' }}>
          <strong>Error:</strong> {data.error}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.items.length === 0) {
    return (
      <div
        style={{
          ...containerStyles,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
        }}
      >
        <div style={{ color: '#999', fontStyle: 'italic' }}>{emptyMessage as string}</div>
      </div>
    );
  }

  // Render items
  return (
    <div style={containerStyles} className="repeater-container">
      {data.items.map((item, index) => renderChildren(item, index))}
    </div>
  );
};

/**
 * Helper: Get value from object by dot-notation path
 */
function getValueByPath(obj: unknown, path: string): unknown {
  if (!path) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export default RepeaterRenderer;
export { RepeaterRenderer };
