import React, { useRef, useState, useEffect } from 'react';
import { ComponentInstance } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';
import './DraggableComponent.css';

interface DraggableComponentProps {
  component: ComponentInstance;
  children: React.ReactNode;
  isSelected?: boolean;
  onSelect?: (componentId: string) => void;
  onDoubleClick?: (componentId: string) => void;
}

/**
 * DraggableComponent - Wrapper that makes components draggable within the canvas
 * Handles drag operations, selection, and positioning
 */
export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  children,
  isSelected = false,
  onSelect,
  onDoubleClick
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);

  const { moveComponent, viewMode } = useBuilderStore();

  // Prevent dragging in preview mode
  const canDrag = viewMode === 'edit';

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canDrag || e.button !== 0) return; // Only left click

    // Don't start drag if clicking on interactive elements or resize handles
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.classList.contains('resize-handle') ||
      target.closest('.resize-handle')
    ) {
      return;
    }

    e.stopPropagation();

    // Select component on mouse down
    onSelect?.(component.instanceId);

    if (componentRef.current) {
      const canvas = componentRef.current.parentElement;
      if (!canvas) return;

      const rect = componentRef.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // Calculate offset from mouse to component top-left
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      // Store initial position relative to canvas for when we switch to absolute
      const initialLeft = rect.left - canvasRect.left;
      const initialTop = rect.top - canvasRect.top;

      // Set initial absolute position to prevent jump when switching from grid to absolute
      componentRef.current.style.left = `${initialLeft}px`;
      componentRef.current.style.top = `${initialTop}px`;
      componentRef.current.style.width = `${rect.width}px`;
      componentRef.current.style.height = `${rect.height}px`;
    }

    // Record starting position for drag detection
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setHasMoved(false);
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !componentRef.current) return;

    // Check if mouse has moved beyond threshold (5 pixels)
    const dragThreshold = 5;
    const deltaX = Math.abs(e.clientX - dragStartPos.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.y);

    if (deltaX > dragThreshold || deltaY > dragThreshold) {
      setHasMoved(true);
    }

    // Only update position if we've moved beyond threshold
    if (!hasMoved && (deltaX <= dragThreshold && deltaY <= dragThreshold)) {
      return;
    }

    e.preventDefault();

    const canvas = componentRef.current.parentElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();

    // Calculate new position relative to canvas
    const newLeft = e.clientX - canvasRect.left - dragOffset.x;
    const newTop = e.clientY - canvasRect.top - dragOffset.y;

    // Update component position immediately (optimistic update)
    componentRef.current.style.left = `${newLeft}px`;
    componentRef.current.style.top = `${newTop}px`;
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging || !componentRef.current) return;

    setIsDragging(false);

    // Clear inline styles to return to grid positioning
    componentRef.current.style.left = '';
    componentRef.current.style.top = '';
    componentRef.current.style.width = '';
    componentRef.current.style.height = '';

    // Only update position if component actually moved
    if (!hasMoved) {
      // Just a click, not a drag - don't update position
      return;
    }

    const canvas = componentRef.current.parentElement;
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const gridConfig = useBuilderStore.getState().gridConfig;

    // Calculate final position
    const finalLeft = e.clientX - canvasRect.left - dragOffset.x;
    const finalTop = e.clientY - canvasRect.top - dragOffset.y;

    // Convert pixel position to grid position
    const columnWidth = canvasRect.width / gridConfig.columns;
    const newColumn = Math.max(1, Math.round(finalLeft / columnWidth) + 1);
    const newRow = Math.max(1, Math.round(finalTop / 100)); // Assuming 100px rows

    // Update component position in store (will trigger re-render with grid positioning)
    moveComponent(component.instanceId, {
      ...component.position,
      column: Math.min(newColumn, gridConfig.columns),
      row: newRow
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!canDrag) return;
    e.stopPropagation();
    onSelect?.(component.instanceId);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!canDrag) return;
    e.stopPropagation();
    onDoubleClick?.(component.instanceId);
  };

  // Attach/detach mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, hasMoved, dragStartPos, dragOffset]);

  // Calculate inline styles from component position and size
  const getComponentStyles = (): React.CSSProperties => {
    const { position, size, styles, zIndex, componentCategory } = component;

    // Check if this is a layout component with auto height
    const isLayoutComponent = componentCategory?.toLowerCase() === 'layout';
    const shouldAutoHeight = isLayoutComponent && size.height === 'auto';

    return {
      gridColumn: `${position.column} / span ${position.columnSpan}`,
      gridRow: `${position.row} / span ${position.rowSpan}`,
      width: size.width,
      height: shouldAutoHeight ? 'auto' : size.height,
      minHeight: shouldAutoHeight ? '1200px' : undefined,
      zIndex: zIndex || 1,
      ...styles
    };
  };

  const handleMoveHandleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();

    console.log('Move handle drag started for:', component.instanceId);

    // Set data for moving existing component
    const dragData = {
      instanceId: component.instanceId,
      componentId: component.componentId,
      isExisting: true
    };
    e.dataTransfer.setData('application/x-builder-component', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';

    console.log('Drag data set:', dragData);
  };

  const handleMoveHandleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    console.log('Move handle drag ended for:', component.instanceId);
  };

  return (
    <div
      ref={componentRef}
      className={`draggable-component ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${!canDrag ? 'view-mode' : ''}`}
      style={getComponentStyles()}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-component-id={component.instanceId}
    >
      {/* Selection Overlay */}
      {isSelected && canDrag && (
        <div className="selection-overlay">
          <div className="selection-border"></div>
          <div className="component-label">
            {component.componentId}
          </div>
        </div>
      )}

      {/* Component Content */}
      <div className="component-content">
        {children}
      </div>

      {/* Move Handle (for moving between containers) */}
      {canDrag && isSelected && (
        <div
          className="move-handle"
          title="Drag to move between containers"
          draggable={true}
          onDragStart={handleMoveHandleDragStart}
          onDragEnd={handleMoveHandleDragEnd}
        >
          ↕
        </div>
      )}
    </div>
  );
};
