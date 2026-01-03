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
  // Note: layoutMode is the primary prop set by the UI, layoutType is legacy/fallback
  const {
    layoutMode,
    layoutType,
    padding = '20px',
    maxWidth = '1200px',
    centerContent = true,
    // Default to true to allow children to grow naturally in flex-column layouts
    // This prevents children from being clipped when they overflow
    allowOverflow = true,
  } = component.props;

  // Use layoutMode if set, otherwise fall back to layoutType, then default
  const effectiveLayout = layoutMode || layoutType || 'flex-column';

  // Get layout styles based on layout mode
  const getLayoutStyles = (): React.CSSProperties => {
    switch (effectiveLayout) {
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
      // Asymmetric 2-column layouts
      case 'grid-20-80':
        return {
          display: 'grid',
          gridTemplateColumns: '20% 80%',
        };
      case 'grid-25-75':
        return {
          display: 'grid',
          gridTemplateColumns: '25% 75%',
        };
      case 'grid-33-67':
        return {
          display: 'grid',
          gridTemplateColumns: '33.33% 66.67%',
        };
      case 'grid-40-60':
        return {
          display: 'grid',
          gridTemplateColumns: '40% 60%',
        };
      case 'grid-60-40':
        return {
          display: 'grid',
          gridTemplateColumns: '60% 40%',
        };
      case 'grid-67-33':
        return {
          display: 'grid',
          gridTemplateColumns: '66.67% 33.33%',
        };
      case 'grid-75-25':
        return {
          display: 'grid',
          gridTemplateColumns: '75% 25%',
        };
      case 'grid-80-20':
        return {
          display: 'grid',
          gridTemplateColumns: '80% 20%',
        };
      case 'flex-column':
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
        };
    }
  };

  // Determine background style - support both solid colors and gradients
  const getBackgroundStyle = (): React.CSSProperties => {
    const { background, backgroundColor } = component.styles;

    // If 'background' is set (could be gradient or color), use it
    if (background) {
      return { background };
    }

    // Otherwise fall back to backgroundColor
    return { backgroundColor: backgroundColor || '#ffffff' };
  };

  // Base container styles
  const containerStyles: React.CSSProperties = {
    ...getLayoutStyles(),
    gap: component.styles.gap || '16px',
    padding: padding as string,
    maxWidth: maxWidth !== 'none' ? (maxWidth as string) : undefined,
    margin: centerContent ? '0 auto' : undefined,
    overflow: allowOverflow ? 'visible' : 'hidden',
    ...getBackgroundStyle(),
    borderRadius: component.styles.borderRadius || '8px',
    boxShadow: component.styles.boxShadow || '0 1px 3px rgba(0,0,0,0.1)',
    minHeight: '100px',
    // Apply additional styles from component (excluding background to avoid override)
    ...Object.fromEntries(
      Object.entries(component.styles as React.CSSProperties).filter(
        ([key]) => key !== 'background' && key !== 'backgroundColor'
      )
    ),
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
