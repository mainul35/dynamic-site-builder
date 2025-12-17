import React, { useRef, useState, useEffect } from 'react';
import { ComponentInstance, ComponentSize } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';
import './ResizableComponent.css';

type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';

interface ResizableComponentProps {
  component: ComponentInstance;
  children: React.ReactNode;
  isSelected?: boolean;
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

  const { resizeComponent, viewMode } = useBuilderStore();

  // Prevent resizing in preview mode
  const canResize = viewMode === 'edit' && isSelected;

  const parseSize = (size: string): number => {
    // Convert size string (e.g., "200px", "50%", "auto") to pixels
    if (size === 'auto' || size === 'inherit') return 0;
    const parsed = parseFloat(size);
    return isNaN(parsed) ? 0 : parsed;
  };

  const handleResizeStart = (e: React.MouseEvent, handle: ResizeHandle) => {
    if (!canResize) return;

    e.stopPropagation();
    e.preventDefault();

    setResizeHandle(handle);
    setStartPos({ x: e.clientX, y: e.clientY });
    setStartSize({ ...component.size });
    setIsResizing(true);
  };

  const handleResizeMove = (e: MouseEvent) => {
    if (!isResizing || !resizeHandle || !startSize || !componentRef.current) return;

    e.preventDefault();

    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;

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

    // For layout components with auto-height, only allow horizontal resizing
    const isLayoutComponent = component.componentCategory?.toLowerCase() === 'layout';
    const shouldAutoHeight = isLayoutComponent && component.size.height === 'auto';

    const handles: ResizeHandle[] = shouldAutoHeight
      ? ['e', 'w'] // Only horizontal handles for auto-height layouts
      : ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw']; // All handles for fixed-height components

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

  // Check if this is a layout component that should auto-resize
  const isLayoutComponent = component.componentCategory?.toLowerCase() === 'layout';
  const shouldAutoHeight = isLayoutComponent && component.size.height === 'auto';

  return (
    <div
      ref={componentRef}
      className={`resizable-component ${isResizing ? 'resizing' : ''} ${canResize ? 'resizable' : ''} ${shouldAutoHeight ? 'auto-height-container' : ''}`}
      style={{
        width: component.size.width,
        height: shouldAutoHeight ? 'auto' : component.size.height,
        minHeight: shouldAutoHeight ? '1200px' : undefined,
        position: 'relative'
      }}
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

      {/* Resize Handles */}
      {renderResizeHandles()}

      {/* Size Indicator (shown while resizing) */}
      {isResizing && (
        <div className="size-indicator">
          {Math.round(parseSize(component.size.width))} × {Math.round(parseSize(component.size.height))}
        </div>
      )}
    </div>
  );
};
