import React, { useState, useEffect, useMemo } from 'react';
import { RendererProps } from './RendererRegistry';
import { ComponentInstance, DataSourceConfig, IteratorConfig } from '../../../types/builder';
import { resolveTemplateVariables, DataContext } from '../../../services/templateService';

/**
 * RepeaterRenderer - Iterates over an array and renders children for each item
 *
 * Features:
 * - Fetches data from configured data source
 * - Clones children for each item in the array
 * - Provides item context for template variable resolution
 * - Supports multiple layout types (flex-column, flex-row, grid)
 * - Shows empty state when no items
 *
 * Props:
 * - dataSource: DataSourceConfig - Where to fetch data
 * - itemAlias: string - Variable name for current item (default: "item")
 * - indexAlias: string - Variable name for index (default: "index")
 * - dataPath: string - Path to array in fetched data (default: "" = root)
 * - emptyMessage: string - Message when no items
 * - layoutType: string - flex-column, flex-row, grid-2col, grid-3col, grid-4col
 * - gap: string - Gap between items
 */

interface RepeaterData {
  items: any[];
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
    dataSource,
    itemAlias = 'item',
    indexAlias = 'index',
    dataPath = '',
    emptyMessage = 'No items to display',
    layoutType = 'flex-column',
    gap = '16px',
    staticItems, // For edit mode preview
  } = component.props;

  // Extract iterator config if provided separately
  const iteratorConfig = component.iteratorConfig;

  // Determine the actual data path
  const effectiveDataPath = iteratorConfig?.dataPath || dataPath;
  const effectiveItemAlias = iteratorConfig?.itemAlias || itemAlias;
  const effectiveIndexAlias = iteratorConfig?.indexAlias || indexAlias;

  // Parse dataSource if it's a string
  const parsedDataSource: DataSourceConfig | undefined = useMemo(() => {
    if (!dataSource) return undefined;
    if (typeof dataSource === 'string') {
      try {
        return JSON.parse(dataSource);
      } catch (e) {
        console.warn('Failed to parse dataSource:', e);
        return undefined;
      }
    }
    return dataSource;
  }, [dataSource]);

  // Fetch data from data source
  useEffect(() => {
    if (isEditMode) {
      // In edit mode, use static items if provided
      if (staticItems) {
        const items = Array.isArray(staticItems) ? staticItems : [];
        setData({ items, loading: false, error: null });
      } else {
        // Show placeholder items in edit mode
        setData({
          items: [
            { id: 1, title: 'Item 1', description: 'Sample item 1' },
            { id: 2, title: 'Item 2', description: 'Sample item 2' },
            { id: 3, title: 'Item 3', description: 'Sample item 3' },
          ],
          loading: false,
          error: null,
        });
      }
      return;
    }

    if (!parsedDataSource) {
      return;
    }

    const fetchData = async () => {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let result: any;

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
        if (effectiveDataPath) {
          const pathParts = effectiveDataPath.split('.');
          for (const part of pathParts) {
            if (items === null || items === undefined) break;
            items = items[part];
          }
        }

        if (!Array.isArray(items)) {
          console.warn('Data at path is not an array:', effectiveDataPath, items);
          items = [];
        }

        setData({ items, loading: false, error: null });
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
  }, [parsedDataSource, effectiveDataPath, isEditMode, staticItems]);

  // Get layout styles
  const getLayoutStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width: '100%',
      height: '100%',
      gap,
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

  // Render children with item context
  const renderChildren = (item: any, index: number) => {
    if (!component.children || component.children.length === 0) {
      // No children - render a simple item representation
      return (
        <div
          key={iteratorConfig?.keyPath ? getValueByPath(item, iteratorConfig.keyPath) : index}
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

    // Clone and render children with resolved props
    return (
      <div
        key={iteratorConfig?.keyPath ? getValueByPath(item, iteratorConfig.keyPath) : index}
        className="repeater-item"
        data-index={index}
      >
        {component.children.map((child, childIndex) =>
          renderChildWithContext(child, context, `${index}-${childIndex}`)
        )}
      </div>
    );
  };

  // Render a child component with resolved template variables
  const renderChildWithContext = (
    child: ComponentInstance,
    context: DataContext,
    key: string
  ): React.ReactNode => {
    // Resolve template variables in props
    const resolvedProps = resolveTemplateVariables(child.props, context);

    // For now, render a placeholder since we don't have access to the full renderer registry here
    // In a real implementation, this would use the RendererRegistry to render the child
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
          {Object.entries(resolvedProps).map(([propKey, propValue]) => (
            <div key={propKey}>
              <strong>{propKey}:</strong> {String(propValue)}
            </div>
          ))}
        </div>
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
        <div style={{ color: '#999', fontStyle: 'italic' }}>{emptyMessage}</div>
        {isEditMode && (
          <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
            Configure data source in Properties panel
          </div>
        )}
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
function getValueByPath(obj: any, path: string): any {
  if (!path) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

export default RepeaterRenderer;
export { RepeaterRenderer };
