import React, { useRef, useState, useEffect } from 'react';
import { ComponentInstance, ComponentSize } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';
import './ResizableComponent.css';

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface ResizableComponentProps {
  component: ComponentInstance;
  children: React.ReactNode;
  isSelected?: boolean;
  isInGridLayout?: boolean; // If true, don't apply fixed width - let grid control sizing
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
}

/**
 * ResizableComponent - Wrapper that makes components resizable
 * Provides resize handles on all edges and corners
 */
export const ResizableComponent: React.FC<ResizableComponentProps> = ({
  component,
  children,
  isSelected = false,
  isInGridLayout = false,
  minWidth = 40,
  minHeight = 40,
  maxWidth,
  maxHeight,
  maintainAspectRatio = false,
  aspectRatio
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [startSize, setStartSize] = useState<ComponentSize | null>(null);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const { resizeComponent, viewMode, hoveredComponentId } = useBuilderStore();

  // Check if this component is the currently hovered one (global state)
  const isHovered = hoveredComponentId === component.instanceId;

  // Allow resizing in edit mode (show handles on hover or when selected)
  const isEditMode = viewMode === 'edit';
  // Show resize handles when in edit mode (they appear on hover via CSS)
  const canResize = isEditMode;

  const parseSize = (size: string): number => {
    // Convert size string (e.g., "200px", "50%", "auto") to pixels
    if (size === 'auto' || size === 'inherit') return 0;
    const parsed = parseFloat(size);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    if (!canResize || !componentRef.current) return;

    e.stopPropagation();
    e.preventDefault();

    // Get actual element dimensions (important when size is 'auto')
    const actualWidth = componentRef.current.offsetWidth;
    const actualHeight = componentRef.current.offsetHeight;

    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    // Store actual pixel dimensions, not the stored size (which might be 'auto')
    setStartSize({
      width: `${actualWidth}px`,
      height: `${actualHeight}px`
    });
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !startSize || !componentRef.current) return;

    e.preventDefault();

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

    // parseSize now works because startSize contains actual pixel values
    let newWidth = parseSize(startSize.width);
    let newHeight = parseSize(startSize.height);

    // Calculate new dimensions based on resize handle
    switch (resizeHandle) {
      case 'e':
      case 'ne':
      case 'se':
        newWidth += deltaX;
        break;
      case 'w':
      case 'nw':
      case 'sw':
        newWidth -= deltaX;
        break;
    }

    switch (resizeHandle) {
      case 's':
      case 'se':
      case 'sw':
        newHeight += deltaY;
        break;
      case 'n':
      case 'ne':
      case 'nw':
        newHeight -= deltaY;
        break;
    }

    // Apply constraints
    newWidth = Math.max(minWidth, newWidth);
    newHeight = Math.max(minHeight, newHeight);

    if (maxWidth) newWidth = Math.min(maxWidth, newWidth);
    if (maxHeight) newHeight = Math.min(maxHeight, newHeight);

    // Maintain aspect ratio if required
    if (maintainAspectRatio && aspectRatio) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    // Update component size immediately (optimistic update)
    componentRef.current.style.width = `${newWidth}px`;
    componentRef.current.style.height = `${newHeight}px`;
  };

  const handleResizeEnd = (e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !componentRef.current) return;

    setIsResizing(false);
    setResizeHandle(null);

    const finalWidth = componentRef.current.offsetWidth;
    const finalHeight = componentRef.current.offsetHeight;

    // Update component size in store
    resizeComponent(component.instanceId, {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`
    });
  };

  // Attach/detach mouse event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = getCursorForHandle(resizeHandle!);
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, resizeHandle]);

  const getCursorForHandle = (handle: ResizeHandle): string => {
    const cursors: Record<ResizeHandle, string> = {
      n: 'ns-resize',
      ne: 'nesw-resize',
      e: 'ew-resize',
      se: 'nwse-resize',
      s: 'ns-resize',
      sw: 'nesw-resize',
      w: 'ew-resize',
      nw: 'nwse-resize'
    };
    return cursors[handle];
  };

  const renderResizeHandles = () => {
    if (!canResize) return null;

    // Show all resize handles for all components
    const handles: ResizeHandle[] = ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'];

    return (
      <div className="resize-handles">
        {handles.map(handle => (
          <div
            key={handle}
            className={`resize-handle resize-handle-${handle}`}
            onMouseDown={(e) => handleResizeStart(e, handle)}
            style={{ cursor: getCursorForHandle(handle) }}
          />
        ))}
      </div>
    );
  };

  // Check if this is a layout component
  const isLayoutComponent = component.componentCategory?.toLowerCase() === 'layout';
  // Check if this is a data container component (Repeater, DataList)
  const isDataContainerComponent = component.componentCategory?.toLowerCase() === 'data' &&
    (component.componentId === 'Repeater' || component.componentId === 'DataList');
  // Layout components use auto height only if explicitly set to 'auto', otherwise use stored height
  // Data container components (Repeater, DataList) always use auto height to wrap children
  const hasExplicitHeight = component.size.height && component.size.height !== 'auto';
  const shouldAutoHeight = (isLayoutComponent && !hasExplicitHeight) || isDataContainerComponent;

  // Child components (with parentId) should size naturally within parent's grid/flex layout
  const isChildComponent = !!component.parentId;

  // Get explicit dimensions from props (set via Properties panel)
  // These take priority over stored size from resize operations
  const propsWidth = component.props?.width as string | undefined;
  const propsHeight = component.props?.height as string | undefined;

  // Calculate styles based on whether this is a root or child component
  const getContainerStyles = (): React.CSSProperties => {
    if (isChildComponent) {
      // Child components: apply their stored dimensions for resizing
      // Priority: props (Properties panel) > size (from resize) > defaults
      // For grid layouts, don't apply any width - let grid cells control sizing completely
      // UNLESS explicit width is set in props
      let childWidth: string | undefined;
      if (propsWidth) {
        // Explicit width from Properties panel - always respect this
        childWidth = propsWidth;
      } else if (isInGridLayout) {
        // In grid layout without explicit width - let grid control sizing
        childWidth = undefined;
      } else {
        // Not in grid, no explicit width - use stored size or default to 100%
        childWidth = (component.size.width === 'auto' || !component.size.width) ? '100%' : component.size.width;
      }

      // Same logic for height
      let childHeight: string | undefined;
      if (propsHeight) {
        // Explicit height from Properties panel - always respect this
        childHeight = propsHeight;
      } else {
        // Data containers nested as children should use auto height to wrap their children
        // Layout containers (Container) nested as children should also use auto height to allow children to expand
        const shouldChildAutoHeight = isDataContainerComponent || (isLayoutComponent && !hasExplicitHeight);
        childHeight = shouldChildAutoHeight ? 'auto' : component.size.height;
      }

      return {
        position: 'relative',
        width: childWidth,
        // Note: Don't apply maxWidth inline - it prevents resize from working
        // CSS handles the visual overflow constraints
        height: childHeight,
        minHeight: (isDataContainerComponent || isLayoutComponent) ? '100px' : undefined,
        boxSizing: 'border-box',
        // CRITICAL: When explicit width is set, prevent flex stretch from parent
        // Without this, flex-column parents stretch children to full width
        alignSelf: propsWidth ? 'flex-start' : undefined,
      };
    }

    // Root-level components: apply explicit dimensions
    // Priority: props (Properties panel) > size (from resize)
    return {
      width: propsWidth || component.size.width,
      // Note: Don't apply maxWidth inline - it prevents resize from working
      height: propsHeight || (shouldAutoHeight ? 'auto' : component.size.height),
      minHeight: shouldAutoHeight ? '40px' : undefined,
      position: 'relative',
      boxSizing: 'border-box',
    };
  };

  return (
    <div
      ref={componentRef}
      className={`resizable-component ${isResizing ? 'resizing' : ''} ${canResize ? 'resizable' : ''} ${shouldAutoHeight ? 'auto-height-container' : ''} ${isChildComponent ? 'child-component' : ''} ${isHovered || isSelected ? 'hovered' : ''}`}
      style={getContainerStyles()}
    >
      {/* Component Content */}
      <div
        className="resizable-content"
        style={{
          height: shouldAutoHeight ? 'auto' : '100%'
        }}
      >
        {children}
      </div>

      {/* Resize Handles - show for all components in edit mode */}
      {renderResizeHandles()}

      {/* Size Indicator (shown while resizing) */}
      {isResizing && (
        <div className="size-indicator">
          {componentRef.current ? `${componentRef.current.offsetWidth} × ${componentRef.current.offsetHeight}` : ''}
        </div>
      )}
    </div>
  );
};
