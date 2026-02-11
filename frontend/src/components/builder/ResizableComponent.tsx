import React, { useRef, useState, useEffect } from 'react';
import { ComponentInstance, ComponentSize } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';
import { capabilityService } from '../../services/componentCapabilityService';
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
  minWidth = 20,
  minHeight = 20,
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
  const [startMinSize, setStartMinSize] = useState<{ childMinWidth: number; childMinHeight: number } | null>(null);

  const { resizeComponent, viewMode, hoveredComponentId, findComponent } = useBuilderStore();

  // Check if this component is the currently hovered one (global state)
  const isHovered = hoveredComponentId === component.instanceId;

  // Allow resizing in edit mode (show handles on hover or when selected)
  const isEditMode = viewMode === 'edit';
  // Show resize handles when in edit mode (they appear on hover via CSS)
  const canResize = isEditMode;

  // Check if component is a layout container - needed early for getMinSizeFromChildren
  const isLayoutComponent = capabilityService.isContainer(component);

  const parseSize = (size: string): number => {
    // Convert size string (e.g., "200px", "50%", "auto") to pixels
    if (size === 'auto' || size === 'inherit') return 0;
    const parsed = parseFloat(size);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate minimum size based on children's dimensions or content height
  // Returns { minWidth, minHeight } that the component cannot shrink below
  // For layout containers (Container, etc.): use default minimums to allow free resizing
  // For leaf components (Label, Button, etc.): measures actual content height
  const getMinSizeFromChildren = (): { childMinWidth: number; childMinHeight: number } => {
    if (!componentRef.current) {
      return { childMinWidth: minWidth, childMinHeight: minHeight };
    }

    // Find all direct child components inside this container (for layout components)
    const childrenContainer = componentRef.current.querySelector('.children-container');

    // Layout containers (Container, etc.) should be freely resizable
    // Children will clip/scroll when container is smaller than content
    // This allows users to shrink containers and use overflow handling
    if (childrenContainer || isLayoutComponent) {
      // Layout containers use default minimums only - allow free resizing
      return { childMinWidth: minWidth, childMinHeight: minHeight };
    }

    // Leaf components (Label, Button, Image, etc.) should be freely resizable
    // Users should have full control over component dimensions
    // Text can wrap or truncate based on the size the user chooses
    // Only layout containers need content-based minimums (handled above)
    return { childMinWidth: minWidth, childMinHeight: minHeight };
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
    // Cache minimum sizes at resize start to prevent recalculation during drag
    setStartMinSize(getMinSizeFromChildren());
    setIsResizing(true);
  };

  // Get the maximum allowed size based on parent container
  // For PageLayout slots, children should not exceed the slot boundaries
  const getParentConstraints = (): { maxWidth: number | null; maxHeight: number | null } => {
    if (!componentRef.current) return { maxWidth: null, maxHeight: null };

    // Find the closest parent slot container (PageLayout region)
    const parentSlot = componentRef.current.closest('[data-slot]');
    if (parentSlot) {
      const parentRect = parentSlot.getBoundingClientRect();
      const padding = 16; // Account for padding in the slot
      return {
        maxWidth: parentRect.width - padding,
        maxHeight: parentRect.height - padding
      };
    }

    return { maxWidth: null, maxHeight: null };
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
    // Only modify width for handles that affect width (e, w, and corners)
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
      // 'n' and 's' handles don't affect width - no case needed
    }

    // Only modify height for handles that affect height (n, s, and corners)
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
      // 'e' and 'w' handles don't affect height - no case needed
    }

    // Use cached minimum sizes from resize start (prevents recalculation during drag)
    const { childMinWidth, childMinHeight } = startMinSize || { childMinWidth: minWidth, childMinHeight: minHeight };

    // Apply constraints - use the larger of default minWidth/minHeight and child-based minimum
    // Only apply width constraints if this handle affects width
    const affectsWidth = ['e', 'w', 'ne', 'nw', 'se', 'sw'].includes(resizeHandle);
    const affectsHeight = ['n', 's', 'ne', 'nw', 'se', 'sw'].includes(resizeHandle);

    if (affectsWidth) {
      newWidth = Math.max(minWidth, childMinWidth, newWidth);
    }
    if (affectsHeight) {
      newHeight = Math.max(minHeight, childMinHeight, newHeight);
    }

    // Get parent container constraints (for PageLayout slots)
    const parentConstraints = getParentConstraints();

    // Apply maximum constraints - use the more restrictive of prop maxWidth/maxHeight and parent constraints
    const effectiveMaxWidth = parentConstraints.maxWidth
      ? (maxWidth ? Math.min(maxWidth, parentConstraints.maxWidth) : parentConstraints.maxWidth)
      : maxWidth;
    const effectiveMaxHeight = parentConstraints.maxHeight
      ? (maxHeight ? Math.min(maxHeight, parentConstraints.maxHeight) : parentConstraints.maxHeight)
      : maxHeight;

    if (effectiveMaxWidth) newWidth = Math.min(effectiveMaxWidth, newWidth);
    if (effectiveMaxHeight) newHeight = Math.min(effectiveMaxHeight, newHeight);

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
    setStartMinSize(null);

    const finalWidth = componentRef.current.offsetWidth;
    const finalHeight = componentRef.current.offsetHeight;

    // Update component size in store
    resizeComponent(component.instanceId, {
      width: `${finalWidth}px`,
      height: `${finalHeight}px`
    });

    // If this is a child component, check if it overflows the parent and resize parent if needed
    if (component.parentId) {
      const parentComponent = findComponent(component.parentId);
      if (parentComponent) {
        // Find the parent's DOM element
        const parentElement = document.querySelector(`[data-component-id="${component.parentId}"]`);
        if (parentElement) {
          const parentRect = parentElement.getBoundingClientRect();
          const childRect = componentRef.current.getBoundingClientRect();

          // Calculate required parent size based on child's actual position relative to parent
          // This accounts for the child's offset within the parent, not just its dimensions
          const buffer = 20; // Buffer for padding/margins

          // Calculate how far the child's right edge extends from the parent's left edge
          const childRightFromParentLeft = childRect.right - parentRect.left;
          // Calculate how far the child's bottom edge extends from the parent's top edge
          const childBottomFromParentTop = childRect.bottom - parentRect.top;

          let newParentWidth = parentRect.width;
          let newParentHeight = parentRect.height;
          let needsParentResize = false;

          // Check if child's right edge exceeds parent's right edge
          if (childRightFromParentLeft + buffer > parentRect.width) {
            newParentWidth = childRightFromParentLeft + buffer;
            needsParentResize = true;
          }

          // Check if child's bottom edge exceeds parent's bottom edge
          if (childBottomFromParentTop + buffer > parentRect.height) {
            newParentHeight = childBottomFromParentTop + buffer;
            needsParentResize = true;
          }

          // Resize parent if needed
          if (needsParentResize) {
            resizeComponent(component.parentId, {
              width: `${newParentWidth}px`,
              height: `${newParentHeight}px`
            });
          }
        }
      }
    }
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

  // Use capability service to check if component should auto-height
  const hasExplicitHeight = component.size.height && component.size.height !== 'auto';
  const shouldAutoHeight = capabilityService.shouldAutoHeight(component) && !hasExplicitHeight;
  // Note: isLayoutComponent is defined earlier in the component (before getMinSizeFromChildren)
  // Check if component is a data container (like Repeater) - has data source capability
  const isDataContainerComponent = capabilityService.hasDataSource(component);

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

      // Same logic for height - consider heightMode prop for containers
      let childHeight: string | undefined;
      const heightMode = component.props?.heightMode as string | undefined;

      if (propsHeight) {
        // Explicit height from Properties panel - always respect this
        childHeight = propsHeight;
      } else if (heightMode === 'wrap') {
        // Wrap mode: ALWAYS use auto height to expand with content
        // This ensures wrap mode containers always auto-expand
        // If user needs fixed height, they should use 'resizable' mode
        childHeight = 'auto';
      } else if (heightMode === 'fill') {
        // Fill mode: 100% of parent height
        childHeight = '100%';
      } else {
        // Resizable mode (default) or data containers: use stored size or auto
        // Data containers nested as children should use auto height to wrap their children
        // Layout containers (Container) nested as children should also use auto height to allow children to expand
        const shouldChildAutoHeight = isDataContainerComponent || (isLayoutComponent && !hasExplicitHeight);
        childHeight = shouldChildAutoHeight ? 'auto' : component.size.height;
      }

      // Determine if we should prevent flex stretch
      // This applies when:
      // 1. Explicit width set via Properties panel (propsWidth)
      // 2. Width has been resized to a pixel value (not '100%' or 'auto')
      const hasExplicitWidth = propsWidth || (childWidth && childWidth !== '100%' && childWidth !== 'auto');

      return {
        position: 'relative',
        width: childWidth,
        // Note: Don't apply maxWidth inline - it prevents resize from working
        // CSS handles the visual overflow constraints
        height: childHeight,
        minHeight: (isDataContainerComponent || isLayoutComponent) ? '100px' : undefined,
        boxSizing: 'border-box',
        // CRITICAL: When explicit width is set (from props or resize), prevent flex stretch from parent
        // Without this, flex-column parents stretch children to full width
        alignSelf: hasExplicitWidth ? 'flex-start' : undefined,
      };
    }

    // Root-level components: apply explicit dimensions
    // Priority: props (Properties panel) > heightMode > stored size
    const heightMode = component.props?.heightMode as string | undefined;

    // Determine height based on heightMode for layout containers
    let rootHeight: string | undefined;
    if (propsHeight) {
      // Explicit height from Properties panel - always respect this
      rootHeight = propsHeight;
    } else if (heightMode === 'wrap') {
      // Wrap mode: ALWAYS use auto height to expand with content
      // This ensures wrap mode containers always auto-expand
      // If user needs fixed height, they should use 'resizable' mode
      rootHeight = 'auto';
    } else if (heightMode === 'fill') {
      // Fill mode: 100% of parent height
      rootHeight = '100%';
    } else if (shouldAutoHeight) {
      // Auto-height components (from capability service)
      rootHeight = 'auto';
    } else {
      // Resizable mode: use stored size
      rootHeight = component.size.height;
    }

    // Use auto minHeight for wrap mode or auto-height components
    const useAutoMinHeight = shouldAutoHeight || heightMode === 'wrap';

    return {
      width: propsWidth || component.size.width,
      // Note: Don't apply maxWidth inline - it prevents resize from working
      height: rootHeight,
      minHeight: useAutoMinHeight ? '40px' : undefined,
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
