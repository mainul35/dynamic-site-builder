import React, { useState, useEffect, useMemo } from 'react';
import { RendererProps } from './RendererRegistry';
import { DataSourceConfig } from '../../../types/builder';

/**
 * DataListRenderer - Pre-styled list for common patterns
 *
 * Features:
 * - Multiple list styles: cards, table, list, grid
 * - Built-in pagination support
 * - Configurable card templates
 * - Column configuration for table style
 *
 * Props:
 * - dataSource: DataSourceConfig - Where to fetch data
 * - listStyle: string - "cards", "table", "list", "grid"
 * - columns: ColumnConfig[] - For table style
 * - cardTemplate: string - "default", "image-top", "horizontal"
 * - pagination: boolean - Enable pagination
 * - pageSize: number - Items per page
 * - dataPath: string - Path to array in fetched data
 */

interface ColumnConfig {
  key: string;
  label: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: 'text' | 'image' | 'date' | 'currency' | 'badge';
}

interface DataListState {
  items: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
}

const DataListRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [state, setState] = useState<DataListState>({
    items: [],
    loading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,
  });

  // Extract props with defaults
  const {
    dataSource,
    listStyle = 'cards',
    columns = [],
    cardTemplate = 'default',
    pagination = false,
    pageSize = 10,
    dataPath = '',
    emptyMessage = 'No data available',
    staticItems, // For edit mode preview
    // Card-specific props
    imageField = 'image',
    titleField = 'title',
    descriptionField = 'description',
    linkField = 'link',
  } = component.props;

  // Parse props if they're strings
  const parsedDataSource: DataSourceConfig | undefined = useMemo(() => {
    if (!dataSource) return undefined;
    if (typeof dataSource === 'string') {
      try {
        return JSON.parse(dataSource);
      } catch (e) {
        return undefined;
      }
    }
    return dataSource;
  }, [dataSource]);

  const parsedColumns: ColumnConfig[] = useMemo(() => {
    if (!columns) return [];
    if (typeof columns === 'string') {
      try {
        return JSON.parse(columns);
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(columns) ? columns : [];
  }, [columns]);

  // Fetch data
  useEffect(() => {
    if (isEditMode) {
      // Use static items or generate sample data
      const sampleItems = staticItems || generateSampleData(listStyle);
      setState({
        items: sampleItems,
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: Math.ceil(sampleItems.length / pageSize),
      });
      return;
    }

    if (!parsedDataSource) {
      return;
    }

    const fetchData = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

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
              throw new Error(`API error: ${response.status}`);
            }
            result = await response.json();
            break;

          case 'static':
            result = parsedDataSource.staticData;
            break;

          default:
            result = [];
        }

        // Extract array from data using path
        let items = result;
        if (dataPath) {
          const pathParts = dataPath.split('.');
          for (const part of pathParts) {
            if (items === null || items === undefined) break;
            items = items[part];
          }
        }

        if (!Array.isArray(items)) {
          items = [];
        }

        setState({
          items,
          loading: false,
          error: null,
          currentPage: 1,
          totalPages: Math.ceil(items.length / pageSize),
        });
      } catch (error) {
        setState({
          items: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch data',
          currentPage: 1,
          totalPages: 1,
        });
      }
    };

    fetchData();
  }, [parsedDataSource, dataPath, isEditMode, staticItems, pageSize, listStyle]);

  // Get paginated items
  const paginatedItems = useMemo(() => {
    if (!pagination) return state.items;
    const start = (state.currentPage - 1) * pageSize;
    return state.items.slice(start, start + pageSize);
  }, [state.items, state.currentPage, pageSize, pagination]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  // Get value from object by path
  const getValue = (item: any, path: string): any => {
    if (!path) return item;
    const parts = path.split('.');
    let current = item;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = current[part];
    }
    return current;
  };

  // Render card item
  const renderCard = (item: any, index: number) => {
    const image = getValue(item, imageField);
    const title = getValue(item, titleField);
    const description = getValue(item, descriptionField);
    const link = getValue(item, linkField);

    const cardStyles: React.CSSProperties = {
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: link ? 'pointer' : 'default',
    };

    const CardWrapper = link && !isEditMode
      ? ({ children }: { children: React.ReactNode }) => (
          <a href={link} style={{ textDecoration: 'none', color: 'inherit' }}>
            {children}
          </a>
        )
      : ({ children }: { children: React.ReactNode }) => <>{children}</>;

    switch (cardTemplate) {
      case 'image-top':
        return (
          <div key={index} style={cardStyles}>
            <CardWrapper>
              {image && (
                <div style={{ width: '100%', height: '160px', overflow: 'hidden' }}>
                  <img
                    src={image}
                    alt={title || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}
              <div style={{ padding: '16px' }}>
                {title && <h3 style={{ margin: '0 0 8px', fontSize: '18px' }}>{title}</h3>}
                {description && (
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{description}</p>
                )}
              </div>
            </CardWrapper>
          </div>
        );

      case 'horizontal':
        return (
          <div key={index} style={{ ...cardStyles, display: 'flex', flexDirection: 'row' }}>
            <CardWrapper>
              <div style={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
                {image && (
                  <div style={{ width: '120px', height: '120px', flexShrink: 0 }}>
                    <img
                      src={image}
                      alt={title || ''}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                )}
                <div style={{ padding: '16px', flex: 1 }}>
                  {title && <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{title}</h3>}
                  {description && (
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{description}</p>
                  )}
                </div>
              </div>
            </CardWrapper>
          </div>
        );

      case 'default':
      default:
        return (
          <div key={index} style={cardStyles}>
            <CardWrapper>
              <div style={{ padding: '16px' }}>
                {title && <h3 style={{ margin: '0 0 8px', fontSize: '16px' }}>{title}</h3>}
                {description && (
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{description}</p>
                )}
              </div>
            </CardWrapper>
          </div>
        );
    }
  };

  // Render list item
  const renderListItem = (item: any, index: number) => {
    const title = getValue(item, titleField);
    const description = getValue(item, descriptionField);

    return (
      <div
        key={index}
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #eee',
          backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
        }}
      >
        {title && <div style={{ fontWeight: 500, marginBottom: '4px' }}>{title}</div>}
        {description && <div style={{ color: '#666', fontSize: '14px' }}>{description}</div>}
      </div>
    );
  };

  // Render table row
  const renderTableRow = (item: any, index: number) => {
    return (
      <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
        {parsedColumns.map((col, colIndex) => {
          const value = getValue(item, col.key);
          return (
            <td
              key={colIndex}
              style={{
                padding: '12px',
                textAlign: col.align || 'left',
                width: col.width,
              }}
            >
              {renderCellValue(value, col.render)}
            </td>
          );
        })}
      </tr>
    );
  };

  // Render cell value based on type
  const renderCellValue = (value: any, render?: string) => {
    if (value === null || value === undefined) return '-';

    switch (render) {
      case 'image':
        return <img src={value} alt="" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
      case 'badge':
        return (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '12px',
              backgroundColor: '#e3f2fd',
              color: '#1976d2',
              fontSize: '12px',
            }}
          >
            {value}
          </span>
        );
      case 'text':
      default:
        return String(value);
    }
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!pagination || state.totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= state.totalPages; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '8px 12px',
            margin: '0 4px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: i === state.currentPage ? '#007bff' : '#fff',
            color: i === state.currentPage ? '#fff' : '#333',
            cursor: 'pointer',
          }}
        >
          {i}
        </button>
      );
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0', gap: '4px' }}>
        <button
          onClick={() => handlePageChange(Math.max(1, state.currentPage - 1))}
          disabled={state.currentPage === 1}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: state.currentPage === 1 ? 'not-allowed' : 'pointer',
            opacity: state.currentPage === 1 ? 0.5 : 1,
          }}
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(Math.min(state.totalPages, state.currentPage + 1))}
          disabled={state.currentPage === state.totalPages}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
            cursor: state.currentPage === state.totalPages ? 'not-allowed' : 'pointer',
            opacity: state.currentPage === state.totalPages ? 0.5 : 1,
          }}
        >
          Next
        </button>
      </div>
    );
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    backgroundColor: component.styles.backgroundColor || 'transparent',
    padding: component.styles.padding || '0',
    borderRadius: component.styles.borderRadius || '0',
    overflow: 'auto',
    boxSizing: 'border-box',
  };

  // Loading state
  if (state.loading) {
    return (
      <div style={{ ...containerStyles, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontStyle: 'italic' }}>Loading...</div>
      </div>
    );
  }

  // Error state
  if (state.error) {
    return (
      <div style={{ ...containerStyles, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#dc3545', padding: '16px' }}>
          <strong>Error:</strong> {state.error}
        </div>
      </div>
    );
  }

  // Empty state
  if (state.items.length === 0) {
    return (
      <div
        style={{
          ...containerStyles,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100px',
        }}
      >
        <div style={{ color: '#999', fontStyle: 'italic' }}>{emptyMessage}</div>
      </div>
    );
  }

  // Render based on list style
  switch (listStyle) {
    case 'table':
      return (
        <div style={containerStyles}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                {parsedColumns.map((col, index) => (
                  <th
                    key={index}
                    style={{
                      padding: '12px',
                      textAlign: col.align || 'left',
                      width: col.width,
                      fontWeight: 600,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((item, index) => renderTableRow(item, index))}
            </tbody>
          </table>
          {renderPagination()}
        </div>
      );

    case 'list':
      return (
        <div style={containerStyles}>
          <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
            {paginatedItems.map((item, index) => renderListItem(item, index))}
          </div>
          {renderPagination()}
        </div>
      );

    case 'grid':
      return (
        <div style={containerStyles}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {paginatedItems.map((item, index) => renderCard(item, index))}
          </div>
          {renderPagination()}
        </div>
      );

    case 'cards':
    default:
      return (
        <div style={containerStyles}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px',
            }}
          >
            {paginatedItems.map((item, index) => renderCard(item, index))}
          </div>
          {renderPagination()}
        </div>
      );
  }
};

/**
 * Generate sample data for edit mode preview
 */
function generateSampleData(listStyle: string): any[] {
  const baseItems = [
    { id: 1, title: 'Product 1', description: 'This is a sample product description', price: 29.99, image: 'https://via.placeholder.com/300x200', status: 'Active' },
    { id: 2, title: 'Product 2', description: 'Another great product for your needs', price: 49.99, image: 'https://via.placeholder.com/300x200', status: 'Active' },
    { id: 3, title: 'Product 3', description: 'Premium quality item with fast shipping', price: 79.99, image: 'https://via.placeholder.com/300x200', status: 'Pending' },
    { id: 4, title: 'Product 4', description: 'Best seller this month', price: 19.99, image: 'https://via.placeholder.com/300x200', status: 'Active' },
  ];

  return baseItems;
}

export default DataListRenderer;
export { DataListRenderer };
