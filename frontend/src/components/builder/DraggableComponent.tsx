import React, {useRef, useState, useEffect} from 'react';
import { ComponentInstance } from '../../types/builder';
import { useBuilderStore } from '../../stores/builderStore';
import { ComponentContextMenu } from './ComponentContextMenu';
import { capabilityService } from '../../services/componentCapabilityService';
import './DraggableComponent.css';

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

interface DraggableComponentProps {
  component: ComponentInstance;
  children: React.ReactNode;
  isSelected?: boolean;
  isInGridLayout?: boolean; // If true, don't apply fixed width - let grid control sizing
  isDropTarget?: boolean; // If true, show drop zone highlight
  onSelect?: (componentId: string) => void;
  onDoubleClick?: (componentId: string) => void;
  onDelete?: (componentId: string) => void;
  onDuplicate?: (componentId: string) => void;
}

/**
 * DraggableComponent - Wrapper that makes components draggable within the canvas
 * Handles drag operations, selection, and positioning
 */
export const DraggableComponent: React.FC<DraggableComponentProps> = ({
  component,
  children,
  isSelected = false,
  isInGridLayout = false,
  isDropTarget = false,
  onSelect,
  onDoubleClick,
  onDelete,
  onDuplicate
}) => {
  const componentRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const { moveComponent, viewMode, hoveredComponentId, removeComponent, duplicateComponent } = useBuilderStore();

  // Check if this component is the currently hovered one (global state)
  const isHovered = hoveredComponentId === component.instanceId;

  // Prevent dragging in preview mode
  const canDrag = viewMode === 'edit';

  const handleMouseDown = (e: React.MouseEvent) => {

    if (!canDrag || e.button !== 0) return; // Only left click

    // Don't start drag if clicking on interactive elements, resize handles, or move handle
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable ||
      target.classList.contains('resize-handle') ||
      target.closest('.resize-handle') ||
      target.classList.contains('move-handle') ||
      target.closest('.move-handle')
    ) {
      return;
    }

    // Check if the click originated from a nested DraggableComponent
    // If so, don't handle this event - let the nested component handle it
    const closestDraggable = target.closest('.draggable-component');
    if (closestDraggable && closestDraggable !== componentRef.current) {
      // Click was on a nested draggable component, don't handle here
      return;
    }

    // Also check if click is inside a slot child wrapper (for PageLayout slots)
    // If so, let the slot child handle it instead of selecting the PageLayout
    // This handles clicks on the child's box-shadow border (which is outside the child's DraggableComponent)
    const slotChildWrapper = target.closest('.slot-child-wrapper');
    if (slotChildWrapper && componentRef.current?.contains(slotChildWrapper)) {
      // Click was inside a slot's child wrapper, but outside the child's DraggableComponent
      // Don't select the parent PageLayout - let the slot system handle it
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    // Select component on mouse down
    onSelect?.(component.instanceId);

    if (componentRef.current) {
      const rect = componentRef.current.getBoundingClientRect();

      // Calculate offset from mouse to component top-left (for potential drag)
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }

    // Record starting position for drag detection
    // Don't set isDragging yet - only set it when mouse actually moves
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

    // Only update position if we've moved beyond threshold
    if (deltaX <= dragThreshold && deltaY <= dragThreshold) {
      return;
    }

    // First time crossing threshold - set up the drag visual state
    if (!hasMoved) {
      setHasMoved(true);

      const canvas = componentRef.current.parentElement;
      if (!canvas) return;

      const rect = componentRef.current.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();

      // Set initial absolute position to prevent jump when switching from grid to absolute
      const initialLeft = rect.left - canvasRect.left;
      const initialTop = rect.top - canvasRect.top;

      componentRef.current.style.left = `${initialLeft}px`;
      componentRef.current.style.top = `${initialTop}px`;
      componentRef.current.style.width = `${rect.width}px`;
      componentRef.current.style.height = `${rect.height}px`;
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

    // Only update position if component actually moved
    if (!hasMoved) {
      // Just a click, not a drag - don't update position or clear styles
      return;
    }

    // Clear inline styles to return to grid positioning (only if we actually dragged)
    componentRef.current.style.left = '';
    componentRef.current.style.top = '';
    componentRef.current.style.width = '';
    componentRef.current.style.height = '';

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

    const target = e.target as HTMLElement;

    // Check if the click originated from a nested DraggableComponent
    const closestDraggable = target.closest('.draggable-component');
    if (closestDraggable && closestDraggable !== componentRef.current) {
      // Click was on a nested draggable component, don't handle here
      return;
    }

    // Also check if click is inside a slot child wrapper (for PageLayout slots)
    const slotChildWrapper = target.closest('.slot-child-wrapper');
    if (slotChildWrapper && componentRef.current?.contains(slotChildWrapper)) {
      // Click was inside a slot's child wrapper - don't handle here
      return;
    }

    // Don't select here - selection is already handled by mousedown
    // The click target can differ from mousedown target due to React re-renders
    // (e.g., selection overlay appearing causes layout shift between mousedown and click)
    // Just stop propagation to prevent parent handlers from firing
    e.stopPropagation();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!canDrag) return;

    // Check if the double-click originated from a nested DraggableComponent
    const target = e.target as HTMLElement;
    const closestDraggable = target.closest('.draggable-component');
    if (closestDraggable && closestDraggable !== componentRef.current) {
      return;
    }

    // Also check if click is inside a slot child wrapper (for PageLayout slots)
    const slotChildWrapper = target.closest('.slot-child-wrapper');
    if (slotChildWrapper && componentRef.current?.contains(slotChildWrapper)) {
      return;
    }

    e.stopPropagation();
    onDoubleClick?.(component.instanceId);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!canDrag) return;

    // Check if the right-click originated from a nested DraggableComponent
    const target = e.target as HTMLElement;
    const closestDraggable = target.closest('.draggable-component');
    if (closestDraggable && closestDraggable !== componentRef.current) {
      // Right-click was on a nested draggable component, don't handle here
      return;
    }

    // Also check if click is inside a slot child wrapper (for PageLayout slots)
    const slotChildWrapper = target.closest('.slot-child-wrapper');
    if (slotChildWrapper && componentRef.current?.contains(slotChildWrapper)) {
      // Click was inside a slot's child wrapper - don't select parent PageLayout
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Select the component on right-click
    onSelect?.(component.instanceId);

    // Open context menu at mouse position
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleDeleteFromContextMenu = (componentId: string) => {
    if (onDelete) {
      onDelete(componentId);
    } else {
      removeComponent(componentId);
    }
  };

  const handleDuplicateFromContextMenu = (componentId: string) => {
    if (onDuplicate) {
      onDuplicate(componentId);
    } else {
      duplicateComponent(componentId);
    }
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
    const { position, size, styles, zIndex, componentCategory, parentId } = component;

    // Layout components use auto height only if height is 'auto', otherwise use stored height
    const isLayoutComponent = componentCategory?.toLowerCase() === 'layout';
    const hasExplicitHeight = size.height && size.height !== 'auto';
    const shouldAutoHeight = isLayoutComponent && !hasExplicitHeight;

    // Child components (with parentId) should not have grid positioning
    // They should let the parent container's grid/flex layout control their positioning
    const isChildComponent = !!parentId;

    if (isChildComponent) {
      // Child components: no grid positioning
      // IMPORTANT: Do NOT apply width/height here - let ResizableComponent handle sizing
      // This allows resize operations to work correctly without being overridden by this wrapper
      // For grid layouts, don't apply any width - let grid cells control sizing
      return {
        ...styles,
        // Let ResizableComponent handle width and height
        // Only apply width for grid layouts where we need cells to fill
        width: isInGridLayout ? '100%' : undefined,
        height: undefined, // Let ResizableComponent handle height
        boxSizing: 'border-box' as const,
      };
    }

    // Root-level components: apply grid positioning
    return {
      gridColumn: `${position.column} / span ${position.columnSpan}`,
      gridRow: `${position.row} / span ${position.rowSpan}`,
      width: size.width,
      // Note: Don't apply maxWidth inline - it prevents resize from working
      height: shouldAutoHeight ? 'auto' : size.height,
      minHeight: shouldAutoHeight ? '40px' : undefined,
      zIndex: zIndex || 1,
      boxSizing: 'border-box' as const,
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

  // Check if this is a child component
  const isChildComponent = !!component.parentId;

  return (
    <>
      <div
        ref={componentRef}
        className={`draggable-component ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${!canDrag ? 'view-mode' : ''} ${isChildComponent ? 'child-component' : ''} ${isHovered && !isSelected ? 'hovered' : ''} ${isDropTarget ? 'drop-target' : ''}`}
        style={getComponentStyles()}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        data-component-id={component.instanceId}
        data-is-container={capabilityService.isContainer(component) ? 'true' : undefined}
      >
        {/* Selection Overlay - always rendered, visibility controlled by CSS to prevent DOM flicker */}
        {canDrag && (
          <div className="selection-overlay" style={{ visibility: isSelected ? 'visible' : 'hidden' }}>
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

        {/* Move Handle (for moving between containers) - always rendered, visibility controlled by CSS */}
        {canDrag && (
          <div
            className="move-handle"
            title="Drag to move between containers"
            draggable={isSelected}
            onDragStart={handleMoveHandleDragStart}
            onDragEnd={handleMoveHandleDragEnd}
            style={{ visibility: isSelected ? 'visible' : 'hidden' }}
          >
            ↕
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <ComponentContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          component={component}
          onClose={handleCloseContextMenu}
          onDelete={handleDeleteFromContextMenu}
          onDuplicate={handleDuplicateFromContextMenu}
        />
      )}
    </>
  );
};
