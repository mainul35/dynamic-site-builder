import React from 'react';
import type { RendererProps, ComponentInstance } from '../types';

// Access global RendererRegistry exposed by the main app
interface RendererRegistry {
  get: (componentId: string, pluginId?: string) => React.FC<RendererProps> | null;
}

const getGlobalRendererRegistry = (): RendererRegistry | null => {
  return (globalThis as unknown as { RendererRegistry?: RendererRegistry }).RendererRegistry || null;
};

/**
 * ChildRenderer - Renders a child component using the global RendererRegistry
 * Plugins are expected to be preloaded by MultiPagePreview before rendering
 */
interface ChildRendererProps {
  child: ComponentInstance;
  isEditMode: boolean;
  childSizeStyles: React.CSSProperties;
}

const ChildRenderer: React.FC<ChildRendererProps> = ({ child, isEditMode, childSizeStyles }) => {
  const registry = getGlobalRendererRegistry();
  const ChildRendererComponent = registry?.get(child.componentId, child.pluginId);

  // Debug logging for nested children (commented out - too verbose)
  // console.log(`[ContainerChildRenderer] Rendering child:`, {
  //   componentId: child.componentId,
  //   pluginId: child.pluginId,
  //   hasRenderer: !!ChildRendererComponent,
  //   instanceId: child.instanceId,
  // });

  if (ChildRendererComponent) {
    // Don't apply height from childSizeStyles - let children determine their own height
    // This ensures wrap mode containers work correctly
    const { height: _ignoredHeight, ...sizeStylesWithoutHeight } = childSizeStyles;
    return (
      <div style={{ width: '100%', height: 'auto', ...sizeStylesWithoutHeight }}>
        <ChildRendererComponent component={child} isEditMode={isEditMode} />
      </div>
    );
  }

  // Fallback for unknown components (plugins should be preloaded by MultiPagePreview)
  console.warn(`[ContainerChildRenderer] No renderer found for ${child.componentId} (plugin: ${child.pluginId})`);
  const childBg = child.styles?.backgroundColor || child.styles?.background;
  // Don't apply height from childSizeStyles - let children determine their own height
  const { height: _fallbackIgnoredHeight, ...fallbackSizeStylesWithoutHeight } = childSizeStyles;
  return (
    <div
      style={{
        width: '100%',
        height: 'auto',
        ...fallbackSizeStylesWithoutHeight,
        ...(childBg ? { backgroundColor: childBg as string } : {}),
        ...child.styles as React.CSSProperties,
      }}
    >
      {child.componentId}
    </div>
  );
};

/**
 * ContainerRenderer - Renders a container layout component
 * Applies the layoutType prop to determine how children are arranged
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Container" is derived from filename "ContainerRenderer.tsx"
 */
// Height mode options for container
type HeightMode = 'fill' | 'resizable' | 'wrap';

const ContainerRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  // Extract props with defaults
  // Note: layoutMode is the primary prop set by the UI, layoutType is legacy/fallback
  const {
    layoutMode,
    layoutType,
    padding = '20px',
    maxWidth = '1200px',
    centerContent = true,
    // DEPRECATED: allowOverflow is no longer used - overflow is now controlled by heightMode
    // Kept for backwards compatibility with saved components
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allowOverflow = true,
    // Height mode: 'fill' (100%), 'resizable' (use size.height), 'wrap' (auto/content-based)
    // Default to 'resizable' to preserve backwards compatibility
    // Overflow behavior: wrap=visible, fill/resizable=auto (scrollbar on overflow)
    heightMode = 'resizable' as HeightMode,
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

  // Determine height styles based on heightMode prop
  // - 'fill': Use 100% height to fill parent
  // - 'resizable': Use the size.height value (pixel-based, user can resize)
  // - 'wrap': Auto height based on content
  const sizeHeight = component.size?.height;

  // Check if size.height indicates fill (100% or percentage string)
  const sizeIndicatesFill = sizeHeight === '100%' as unknown as number ||
    (typeof sizeHeight === 'string' && (sizeHeight as string).includes('%'));

  // Determine effective height mode - if size indicates fill, use fill mode
  const effectiveHeightMode: HeightMode = sizeIndicatesFill ? 'fill' : (heightMode as HeightMode);

  // Calculate height and minHeight based on mode
  const getHeightStyles = (): { height?: string; minHeight?: string } => {
    switch (effectiveHeightMode) {
      case 'fill':
        // Fill parent height - use 100%
        return { height: '100%', minHeight: undefined };
      case 'wrap':
        // Wrap content - don't set explicit height, let content determine size naturally
        // Not setting height at all (undefined) allows the container to shrink-wrap its content
        return { height: undefined, minHeight: undefined };
      case 'resizable':
      default:
        // Resizable - use the size.height if set, otherwise minHeight
        if (sizeHeight && typeof sizeHeight === 'number' && sizeHeight > 0) {
          return { height: `${sizeHeight}px`, minHeight: undefined };
        }
        if (sizeHeight && typeof sizeHeight === 'string') {
          return { height: sizeHeight, minHeight: undefined };
        }
        // Default to minHeight if no size specified
        return { height: undefined, minHeight: '100px' };
    }
  };

  // Get overflow based on heightMode
  // - 'wrap': visible (allows container to expand with content)
  // - 'fill'/'resizable': auto (enables scrollbar when content overflows)
  const getOverflowStyle = (): 'visible' | 'auto' | 'hidden' => {
    if (effectiveHeightMode === 'wrap') {
      return 'visible';
    }
    // For fill and resizable modes, use auto to enable scrolling
    // This takes precedence over allowOverflow when height is constrained
    return 'auto';
  };

  const heightStyles = getHeightStyles();

  // Base container styles
  const containerStyles: React.CSSProperties = {
    ...getLayoutStyles(),
    gap: component.styles.gap || '16px',
    padding: padding as string,
    maxWidth: maxWidth !== 'none' ? (maxWidth as string) : undefined,
    margin: centerContent ? '0 auto' : undefined,
    // Overflow is determined by heightMode:
    // - wrap: visible (expand with content)
    // - fill/resizable: auto (scroll when content overflows)
    overflow: getOverflowStyle(),
    ...getBackgroundStyle(),
    borderRadius: component.styles.borderRadius || '8px',
    boxShadow: component.styles.boxShadow || '0 1px 3px rgba(0,0,0,0.1)',
    // Apply height based on heightMode
    ...heightStyles,
    // Apply additional styles from component (excluding properties we control)
    // Exclude height/minHeight so heightMode logic is respected
    ...Object.fromEntries(
      Object.entries(component.styles as React.CSSProperties).filter(
        ([key]) => !['background', 'backgroundColor', 'overflow', 'height', 'minHeight'].includes(key)
      )
    ),
  };

  // Helper to get child component's size styles
  const getChildSizeStyles = (child: ComponentInstance): React.CSSProperties => {
    const sizeStyles: React.CSSProperties = {};

    // Apply width from size if it's a valid pixel/percentage value
    if (child.size?.width) {
      const width = child.size.width;
      if (typeof width === 'string') {
        sizeStyles.width = width;
      } else if (typeof width === 'number' && width > 0) {
        sizeStyles.width = `${width}px`;
      }
    }

    // Apply height from size if it's a valid pixel/percentage value (not 'auto')
    if (child.size?.height) {
      const height = child.size.height;
      if (typeof height === 'string' && height !== 'auto') {
        sizeStyles.height = height;
      } else if (typeof height === 'number' && height > 0) {
        sizeStyles.height = `${height}px`;
      }
    }

    return sizeStyles;
  };

  // Render children using ChildRenderer
  const renderChildren = () => {
    if (!component.children || component.children.length === 0) {
      // console.log(`[ContainerRenderer] No children for container ${component.instanceId}`);
      return null;
    }

    // console.log(`[ContainerRenderer] Rendering ${component.children.length} children for container ${component.instanceId}:`,
    //   component.children.map(c => ({ id: c.instanceId, componentId: c.componentId, pluginId: c.pluginId }))
    // );

    return component.children.map((child: ComponentInstance) => {
      const childSizeStyles = getChildSizeStyles(child);
      return (
        <ChildRenderer
          key={child.instanceId}
          child={child}
          isEditMode={isEditMode}
          childSizeStyles={childSizeStyles}
        />
      );
    });
  };

  // In edit mode, we don't render children here - BuilderCanvas handles that
  if (isEditMode) {
    return (
      <div style={containerStyles} className="container-renderer edit-mode">
        {/* Children are rendered by BuilderCanvas in edit mode */}
      </div>
    );
  }

  // Preview mode - render container with children
  return (
    <div style={containerStyles} className="container-renderer preview-mode">
      {renderChildren()}
    </div>
  );
};

export default ContainerRenderer;
export { ContainerRenderer };
