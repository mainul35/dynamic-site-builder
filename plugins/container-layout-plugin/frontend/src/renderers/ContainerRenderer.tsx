import React from 'react';
import type { RendererProps } from '../types';

/**
 * ContainerRenderer - Renders a container layout component
 * Applies the layoutType prop to determine how children are arranged
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Container" is derived from filename "ContainerRenderer.tsx"
 */
const ContainerRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  // Extract props with defaults
  const {
    layoutType = 'flex-column',
    padding = '20px',
    maxWidth = '1200px',
    centerContent = true,
    allowOverflow = false,
  } = component.props;

  // Get layout styles based on layoutType
  const getLayoutStyles = (): React.CSSProperties => {
    switch (layoutType) {
      case 'flex-row':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
        };
      case 'flex-wrap':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
        };
      case 'grid-2col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
        };
      case 'grid-3col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
        };
      case 'grid-4col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        };
      case 'grid-auto':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        };
      case 'flex-column':
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
        };
    }
  };

  // Base container styles
  const containerStyles: React.CSSProperties = {
    ...getLayoutStyles(),
    gap: component.styles.gap || '16px',
    padding: padding as string,
    maxWidth: maxWidth !== 'none' ? (maxWidth as string) : undefined,
    margin: centerContent ? '0 auto' : undefined,
    overflow: allowOverflow ? 'visible' : 'hidden',
    backgroundColor: component.styles.backgroundColor || '#ffffff',
    borderRadius: component.styles.borderRadius || '8px',
    boxShadow: component.styles.boxShadow || '0 1px 3px rgba(0,0,0,0.1)',
    minHeight: '100px',
    // Apply additional styles from component
    ...(component.styles as React.CSSProperties),
  };

  // In edit mode, we don't render children here - BuilderCanvas handles that
  // This renderer is mainly for preview mode
  if (isEditMode) {
    return (
      <div style={containerStyles} className="container-renderer edit-mode">
        {/* Children are rendered by BuilderCanvas in edit mode */}
      </div>
    );
  }

  // Preview mode - render a clean container
  // Note: Children are passed through the component tree, not directly here
  return (
    <div style={containerStyles} className="container-renderer preview-mode">
      {/* Children are rendered by the parent component */}
    </div>
  );
};

export default ContainerRenderer;
export { ContainerRenderer };
