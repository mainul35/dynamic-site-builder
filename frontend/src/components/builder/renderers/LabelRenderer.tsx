import React, { useState, useEffect } from 'react';
import { RendererProps } from './RendererRegistry';

/**
 * API base URL for relative paths
 * Matches the configuration in services/api.ts
 */
const API_BASE_URL = '/api';

/**
 * Helper function to resolve the full URL from a data source path
 * - If URL starts with 'http://' or 'https://', use as-is (full URL)
 * - If URL starts with '/api/', use as-is (already includes base path)
 * - If URL starts with '/', prepend API_BASE_URL
 * - Otherwise, prepend API_BASE_URL + '/'
 */
const resolveDataSourceUrl = (url: string): string => {
  if (!url) return '';

  // Full URL - use as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Already has /api prefix - use as-is
  if (url.startsWith('/api/') || url.startsWith('/api')) {
    return url;
  }

  // Relative path starting with / - prepend base URL
  if (url.startsWith('/')) {
    return `${API_BASE_URL}${url}`;
  }

  // Relative path without / - prepend base URL with /
  return `${API_BASE_URL}/${url}`;
};

/**
 * Helper function to extract a value from an object using a dot-notation path
 * e.g., getNestedValue({ data: { content: 'Hello' } }, 'data.content') returns 'Hello'
 */
const getNestedValue = (obj: any, path: string): any => {
  if (!path) return obj;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return undefined;
    result = result[key];
  }
  return result;
};

/**
 * LabelRenderer - Renders a text label component
 * Supports various HTML element types (h1-h6, p, span, caption)
 * Can fetch content from an API with fallback to static text
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Label" is derived from filename "LabelRenderer.tsx"
 */
const LabelRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  // Extract props with defaults
  const {
    text = 'Label Text',
    variant = 'p',
    textAlign = 'left',
    truncate = false,
    maxLines = 0,
    dataSourceUrl = '',
    dataSourceField = '',
    loadingText = 'Loading...',
    errorText = '',
  } = component.props;

  // State for dynamic content
  const [displayText, setDisplayText] = useState<string>(text);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Fetch data from API if dataSourceUrl is provided
  useEffect(() => {
    // If no data source URL, use static text
    if (!dataSourceUrl) {
      setDisplayText(text);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    // In edit mode, show placeholder instead of fetching
    if (isEditMode) {
      setDisplayText(`[API: ${dataSourceUrl}]`);
      return;
    }

    // Fetch from API
    const fetchData = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const resolvedUrl = resolveDataSourceUrl(dataSourceUrl);
        const response = await fetch(resolvedUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Extract the value using the field path, or use the whole response if no field specified
        const extractedValue = dataSourceField
          ? getNestedValue(data, dataSourceField)
          : (typeof data === 'string' ? data : JSON.stringify(data));

        if (extractedValue !== undefined && extractedValue !== null) {
          setDisplayText(String(extractedValue));
        } else {
          // Field not found in response, use fallback
          throw new Error('Field not found in response');
        }
      } catch (error) {
        console.error('LabelRenderer: Failed to fetch data:', error);
        setHasError(true);
        // Use errorText if provided, otherwise fall back to static text
        setDisplayText(errorText || text);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dataSourceUrl, dataSourceField, text, errorText, isEditMode]);

  // Get styles from component
  const customStyles = component.styles || {};

  // Variant-specific default styles
  const variantDefaults: Record<string, React.CSSProperties> = {
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.25 },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.35 },
    h5: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.45 },
    p: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    span: { fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' },
    caption: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4, color: '#666' },
  };

  // Build the style object
  const labelStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    textAlign: textAlign as React.CSSProperties['textAlign'],
    color: '#333333',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    // Apply variant defaults first
    ...variantDefaults[variant],
    // Then apply custom styles (they override defaults)
    ...(customStyles as React.CSSProperties),
  };

  // Apply truncation styles if enabled
  if (truncate) {
    labelStyles.overflow = 'hidden';
    labelStyles.textOverflow = 'ellipsis';
    labelStyles.whiteSpace = 'nowrap';
  }

  // Apply max lines clamping if specified
  if (maxLines > 0 && !truncate) {
    labelStyles.display = '-webkit-box';
    labelStyles.WebkitLineClamp = maxLines;
    labelStyles.WebkitBoxOrient = 'vertical';
    labelStyles.overflow = 'hidden';
  }

  // Add loading/error visual feedback
  if (isLoading) {
    labelStyles.opacity = 0.7;
    labelStyles.fontStyle = 'italic';
  }
  if (hasError && !errorText) {
    labelStyles.opacity = 0.8;
  }

  // Create the element based on variant
  const Element = variant as keyof JSX.IntrinsicElements;

  // Determine what text to show
  const textToShow = isLoading ? loadingText : displayText;

  return (
    <Element style={labelStyles} className="label-renderer">
      {textToShow}
    </Element>
  );
};

export default LabelRenderer;
export { LabelRenderer };
