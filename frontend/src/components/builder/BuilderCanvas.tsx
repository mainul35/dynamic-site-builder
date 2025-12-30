import React, { useRef, useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { ComponentInstance, ComponentRegistryEntry } from '../../types/builder';
import { DraggableComponent } from './DraggableComponent';
import { ResizableComponent } from './ResizableComponent';
import { ComponentRenderer } from './renderers';
import { CanvasContextMenu } from './CanvasContextMenu';
import './BuilderCanvas.css';

interface CanvasContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

interface BuilderCanvasProps {
  onComponentSelect?: (componentId: string | null) => void;
  // Optional page override for preview mode - allows rendering a different page
  // without modifying the builder store's currentPage
  pageOverride?: import('../../types/builder').PageDefinition | null;
}

/**
 * BuilderCanvas - Main canvas where components are placed and arranged
 * Implements grid-based layout with drag-drop support
 */
export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ onComponentSelect, pageOverride }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const [canvasContextMenu, setCanvasContextMenu] = useState<CanvasContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });

  const {
    currentPage: storeCurrentPage,
    selectedComponentId,
    hoveredComponentId,
    gridConfig,
    viewMode,
    addComponent,
    selectComponent,
    removeComponent,
    reparentComponent,
    setHoveredComponent
  } = useBuilderStore();

  // Use pageOverride if provided (for preview mode), otherwise use store's currentPage
  const currentPage = pageOverride !== undefined ? pageOverride : storeCurrentPage;

  const { getManifest } = useComponentStore();
  const { showGrid } = useUIPreferencesStore();

  // Global hover tracking - single listener for entire canvas
  // This finds the innermost (closest) draggable component under the mouse
  useEffect(() => {
    if (viewMode !== 'edit') return;

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Find the closest (innermost) draggable-component from the mouse target
      const closestDraggable = target.closest('.draggable-component') as HTMLElement | null;

      if (closestDraggable) {
        const componentId = closestDraggable.getAttribute('data-component-id');
        if (componentId && componentId !== hoveredComponentId) {
          setHoveredComponent(componentId);
        }
      } else {
        // Mouse is not over any draggable component
        if (hoveredComponentId) {
          setHoveredComponent(null);
        }
      }
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [viewMode, hoveredComponentId, setHoveredComponent]);

  // Helper function to find component recursively
  const findComponentRecursive = (component: ComponentInstance, targetId: string): ComponentInstance | null => {
    if (component.instanceId === targetId) {
      return component;
    }
    if (component.children) {
      for (const child of component.children) {
        const found = findComponentRecursive(child, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle template drop - adds all template components to canvas
  const handleTemplateDrop = (e: React.DragEvent, templateData: string) => {
    try {
      const template = JSON.parse(templateData);
      const { components, suggestedSize } = template;

      if (!components || !Array.isArray(components) || components.length === 0) {
        console.warn('Template has no components');
        return;
      }

      // Calculate drop position
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const y = e.clientY - rect.top;
      const baseRow = Math.max(1, Math.floor(y / 100) + 1);

      // Add each component from the template
      // Templates typically have a root container with children
      components.forEach((component: ComponentInstance, index: number) => {
        // Update position for the root component
        const updatedComponent: ComponentInstance = {
          ...component,
          instanceId: `${component.componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          position: {
            ...component.position,
            row: baseRow + index,
            column: 1,
            columnSpan: suggestedSize?.columnSpan || 12,
            rowSpan: suggestedSize?.rowSpan || 1,
          },
          // Recursively update instanceIds for children
          children: component.children ? updateChildInstanceIds(component.children) : [],
        };

        addComponent(updatedComponent);

        // Select the first component
        if (index === 0) {
          selectComponent(updatedComponent.instanceId);
          onComponentSelect?.(updatedComponent.instanceId);
        }
      });

      console.log(`[BuilderCanvas] Added template: ${template.templateName}`);
    } catch (error) {
      console.error('Failed to add template:', error);
    }
  };

  // Helper to recursively update instance IDs for template children
  const updateChildInstanceIds = (children: ComponentInstance[]): ComponentInstance[] => {
    return children.map(child => ({
      ...child,
      instanceId: `${child.componentId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      children: child.children ? updateChildInstanceIds(child.children) : [],
    }));
  };

  // Handle drop from component palette or existing component
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      // Check if this is an existing component being moved to root
      const existingComponentData = e.dataTransfer.getData('application/x-builder-component');

      if (existingComponentData) {
        const dragData = JSON.parse(existingComponentData);
        if (dragData.isExisting && dragData.instanceId) {
          // Calculate insertion index based on drop position for root level
          let insertIndex: number | undefined = undefined;

          const rootComponents = currentPage?.components.filter(c => !c.parentId) || [];
          const dropY = e.clientY;

          // Find the insertion index by comparing Y positions
          insertIndex = rootComponents.findIndex(comp => {
            const compElement = document.querySelector(`[data-component-id="${comp.instanceId}"]`);
            if (compElement) {
              const rect = compElement.getBoundingClientRect();
              const compMiddleY = rect.top + rect.height / 2;
              return dropY < compMiddleY;
            }
            return false;
          });

          // If not found, append to end
          if (insertIndex === -1) {
            insertIndex = rootComponents.length;
          }

          // Moving existing component to root level (no parent)
          console.log('Reparenting to root at index', insertIndex);
          reparentComponent(dragData.instanceId, null, insertIndex);
          selectComponent(dragData.instanceId);
          onComponentSelect?.(dragData.instanceId);
          return;
        }
      }

      // Check if this is a template drop
      const templateData = e.dataTransfer.getData('application/template');
      if (templateData) {
        handleTemplateDrop(e, templateData);
        return;
      }

      // Otherwise, this is a new component from the palette
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const componentEntry: ComponentRegistryEntry = JSON.parse(data);

      // Get component manifest for default props and styles
      const manifest = getManifest(componentEntry.pluginId, componentEntry.componentId);
      const parsedManifest = manifest || JSON.parse(componentEntry.componentManifest);

      // Get component category
      const category = componentEntry.category?.toLowerCase() || '';
      const isLayout = category === 'layout';

      // Find parent layout based on drop position
      let parentLayout: ComponentInstance | null = null;

      // Get all container components (layout and data containers like Repeater)
      const getAllContainerComponents = (components: ComponentInstance[]): ComponentInstance[] => {
        const containers: ComponentInstance[] = [];
        components.forEach(comp => {
          const isLayoutComp = comp.componentCategory?.toLowerCase() === 'layout';
          const isDataContainer = comp.componentCategory?.toLowerCase() === 'data' &&
            (comp.componentId === 'Repeater' || comp.componentId === 'DataList');

          if (isLayoutComp || isDataContainer) {
            containers.push(comp);
            if (comp.children && comp.children.length > 0) {
              containers.push(...getAllContainerComponents(comp.children));
            }
          }
        });
        return containers;
      };

      const allLayoutComponents = getAllContainerComponents(currentPage?.components || []);

      // For non-layout components, enforce layout-first rule
      if (!isLayout && allLayoutComponents.length === 0) {
        alert('Please add a layout component first before adding UI components.');
        return;
      }

      // Find the most appropriate parent based on drop position
      // For now, automatically assign to the first available layout
      // TODO: Implement visual drop zones for precise parent selection
      if (!isLayout || allLayoutComponents.length > 0) {
        // Non-layout components must have a layout parent
        // Layout components can optionally have a layout parent (for nesting)
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = e.clientX;
          const mouseY = e.clientY;

          // Try to find a layout component that contains the drop point
          // For now, use the first layout as parent
          parentLayout = allLayoutComponents[0] || null;
        }
      }

      // Calculate drop position in grid
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const columnWidth = rect.width / gridConfig.columns;
      const column = Math.max(1, Math.min(gridConfig.columns, Math.floor(x / columnWidth) + 1));
      const row = Math.max(1, Math.floor(y / 100) + 1); // Assuming 100px rows

      // Create new component instance
      const newComponent: ComponentInstance = {
        instanceId: `${componentEntry.componentId}-${Date.now()}`,
        pluginId: componentEntry.pluginId,
        componentId: componentEntry.componentId,
        componentCategory: category as any,
        parentId: parentLayout?.instanceId || null, // Assign to parent layout if exists
        position: {
          row,
          column,
          rowSpan: 1,
          columnSpan: parsedManifest.sizeConstraints?.defaultWidth === '100%' ? gridConfig.columns : 4
        },
        size: {
          width: parsedManifest.sizeConstraints?.defaultWidth || '200px',
          height: parsedManifest.sizeConstraints?.defaultHeight || '100px'
        },
        props: parsedManifest.defaultProps || {},
        styles: parsedManifest.defaultStyles || {},
        children: [],
        isVisible: true,
        zIndex: 1
      };

      addComponent(newComponent);

      // If this is a child component, add it to parent's children array
      if (parentLayout) {
        // Note: The builderStore.addComponent should handle this relationship
        console.log(`Adding ${newComponent.instanceId} as child of ${parentLayout.instanceId}`);
      }

      selectComponent(newComponent.instanceId);
      onComponentSelect?.(newComponent.instanceId);
    } catch (error) {
      console.error('Failed to add component:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Deselect component if clicking on empty canvas
    if (e.target === e.currentTarget) {
      selectComponent(null);
      onComponentSelect?.(null);
    }
  };

  // Handle right-click on empty canvas area
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    // Only show canvas context menu in edit mode
    if (viewMode !== 'edit') return;

    // Only handle if clicking directly on canvas (not on a component)
    // Components have their own context menu handlers
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.empty-canvas-state')) {
      e.preventDefault();
      e.stopPropagation();

      setCanvasContextMenu({
        isOpen: true,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };

  const handleCloseCanvasContextMenu = () => {
    setCanvasContextMenu({ isOpen: false, x: 0, y: 0 });
  };

  const handleComponentSelect = (componentId: string) => {
    selectComponent(componentId);
    onComponentSelect?.(componentId);
  };

  const handleComponentDoubleClick = (componentId: string) => {
    // Open properties panel or enter edit mode
    console.log('Double clicked component:', componentId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Delete selected component with Delete or Backspace key
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
      e.preventDefault();
      removeComponent(selectedComponentId);
      onComponentSelect?.(null);
    }
  };

  // Get layout styles based on layoutType prop
  const getLayoutStyles = (layoutType: string = 'flex-column'): React.CSSProperties => {
    switch (layoutType) {
      case 'flex-row':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'flex-start',
          alignContent: 'flex-start',
        };
      case 'flex-wrap':
        return {
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          alignContent: 'flex-start',
        };
      case 'grid-2col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-3col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-4col':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-auto':
        return {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'flex-column':
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
        };
    }
  };

  // Render component using the ComponentRenderer system
  const renderComponent = (component: ComponentInstance) => {
    const isLayout = component.componentCategory?.toLowerCase() === 'layout';
    const hasChildren = component.children && component.children.length > 0;
    const isEditMode = viewMode === 'edit';

    // Check if this is a data component that can have children (like Repeater)
    // These components need to show the same drag-drop UI as layout components
    const isDataContainerComponent = component.componentCategory?.toLowerCase() === 'data' &&
      (component.componentId === 'Repeater' || component.componentId === 'DataList');

    // For layout components and data container components, render container with children
    if (isLayout || isDataContainerComponent) {
      // Get layout type from component props - layoutMode is primary (set by UI), layoutType is fallback
      const layoutType = component.props?.layoutMode || component.props?.layoutType || 'flex-column';
      const layoutStyles = getLayoutStyles(layoutType);

      // In preview mode, render clean layout without builder chrome
      if (!isEditMode) {
        // For height, only apply explicit pixel/percentage values, not 'auto'
        const previewHeight = component.size.height && component.size.height !== 'auto'
          ? component.size.height
          : undefined;

        // Apply maxWidth and centering if specified in props
        const maxWidth = component.props?.maxWidth;
        const centerContent = component.props?.centerContent;

        // Get gap from props or styles (important for preview mode)
        const previewGap = component.props?.gap || component.styles?.gap;

        // Get padding from styles first (templates set it there), then props
        const previewPadding = component.styles?.padding || component.props?.padding;

        // Get minimum height for empty containers (so they're visible in preview)
        const minHeight = hasChildren ? undefined : '50px';

        // For flex-row layouts, calculate flex values based on stored widths
        // so children fill 100% of container proportionally
        const isFlexRow = layoutType === 'flex-row' || layoutType === 'flex-wrap';

        // Get flex alignment props from component props (templates set these)
        const alignItems = component.props?.alignItems;
        const justifyContent = component.props?.justifyContent;
        const flexWrap = component.styles?.flexWrap as React.CSSProperties['flexWrap'];

        // Extract styles excluding width and maxWidth - these should be controlled by props, not stored value
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { width: _ignoredWidth, maxWidth: _ignoredMaxWidth, ...stylesWithoutWidth } = component.styles || {};

        return (
          <div
            className="layout-preview"
            style={{
              ...stylesWithoutWidth,
              ...layoutStyles,
              // Override with explicit flex props from template
              alignItems: alignItems || layoutStyles.alignItems,
              justifyContent: justifyContent || layoutStyles.justifyContent,
              flexWrap: flexWrap || layoutStyles.flexWrap,
              height: previewHeight,
              minHeight: minHeight,
              maxWidth: maxWidth && maxWidth !== 'none' ? maxWidth : undefined,
              marginLeft: centerContent ? 'auto' : undefined,
              marginRight: centerContent ? 'auto' : undefined,
              gap: previewGap,
              padding: previewPadding,
            }}
          >
            {hasChildren && component.children!.map(child => {
              // Check if child is also a layout component
              const childIsLayout = child.componentCategory?.toLowerCase() === 'layout';

              // For non-layout children, just render them directly without wrapper
              if (!childIsLayout) {
                return (
                  <React.Fragment key={child.instanceId}>
                    {renderComponent(child)}
                  </React.Fragment>
                );
              }

              // For layout children, apply sizing based on parent layout type
              const childHeight = child.size.height && child.size.height !== 'auto'
                ? child.size.height
                : undefined;

              return (
                <div
                  key={child.instanceId}
                  className="layout-child-wrapper"
                  style={{
                    width: isFlexRow ? undefined : '100%',
                    height: childHeight,
                    flex: isFlexRow ? '1' : undefined,
                  }}
                >
                  {renderComponent(child)}
                </div>
              );
            })}
          </div>
        );
      }

      // Edit mode: Show builder chrome with labels and drop zones
      // Check if this is a scrollable container
      const isScrollable = component.componentId === 'scrollable-container';
      const scrollDirection = component.props?.scrollDirection || 'vertical';
      // Use component.size.height (from resize) first, then fall back to props.height
      const containerHeight = component.size?.height || component.props?.height || '400px';
      const containerPadding = component.props?.padding || '16px';
      const containerGap = component.props?.gap || component.styles?.gap || '8px';
      // Check if this is a grid layout - grid children should fill their cells
      const isGridLayout = layoutType.startsWith('grid-');
      // Check if this is a flex-row layout - children should use their stored widths
      const isFlexRowLayout = layoutType === 'flex-row' || layoutType === 'flex-wrap';

      // Get flex alignment props from component props (same as preview mode)
      const editAlignItems = component.props?.alignItems;
      const editJustifyContent = component.props?.justifyContent;
      const editFlexWrap = component.styles?.flexWrap as React.CSSProperties['flexWrap'];

      // Get overflow styles for scrollable containers
      const getScrollOverflow = () => {
        if (!isScrollable) return { overflow: 'visible' };
        switch (scrollDirection) {
          case 'horizontal':
            return { overflowX: 'auto' as const, overflowY: 'hidden' as const };
          case 'both':
            return { overflowX: 'auto' as const, overflowY: 'auto' as const };
          case 'vertical':
          default:
            return { overflowX: 'hidden' as const, overflowY: 'auto' as const };
        }
      };

      return (
        <div
          className={`component-placeholder layout-placeholder ${isScrollable ? 'scrollable-layout' : ''}`}
          style={{
            ...component.styles,
            height: isScrollable ? containerHeight : undefined,
          }}
          onClick={(e) => {
            // Stop propagation to prevent parent containers from receiving the click
            // The DraggableComponent wrapper will handle the selection
            e.stopPropagation();
          }}
        >
          <div
            className="placeholder-header"
            onClick={(e) => {
              // Stop propagation - clicking header should not bubble to parents
              e.stopPropagation();
            }}
          >
            <span className="placeholder-id">{component.componentId}</span>
            <span className={`layout-badge ${isDataContainerComponent ? 'data-badge' : ''}`}>
              {isDataContainerComponent ? 'Data' : 'Layout'}
            </span>
            <span className="layout-type-badge">{layoutType}</span>
            {isScrollable && (
              <span className="scroll-direction-badge">
                {scrollDirection === 'horizontal' ? '↔' : scrollDirection === 'both' ? '↔↕' : '↕'}
              </span>
            )}
          </div>

          {/* Render children for layout components - apply layoutType styles */}
          <div
            className={`children-container ${dragOverContainerId === component.instanceId ? 'drag-over' : ''} ${isScrollable ? 'scrollable-children' : ''} ${isGridLayout ? 'grid-layout' : ''} ${isFlexRowLayout ? 'flex-row-layout' : ''}`}
            style={{
              ...layoutStyles,
              ...getScrollOverflow(),
              // Apply alignItems and justifyContent from component props (same as preview mode)
              alignItems: editAlignItems || layoutStyles.alignItems,
              justifyContent: editJustifyContent || layoutStyles.justifyContent,
              flexWrap: editFlexWrap || layoutStyles.flexWrap,
              gap: containerGap,
              padding: isScrollable ? containerPadding : undefined,
              // For scrollable containers with flex layouts, use flex: 1 to fill available space
              // For grid layouts, don't use flex: 1 as it interferes with grid sizing
              flex: (isScrollable && !isGridLayout) ? 1 : undefined,
              minHeight: (isScrollable && !isGridLayout) ? 0 : undefined, // Allow flex shrinking only for flex layouts
              scrollBehavior: component.props?.smoothScroll ? 'smooth' : 'auto',
            }}
            onClick={(e) => {
              // Always stop propagation to prevent bubbling to parent containers
              // Child DraggableComponents have their own click handlers that will fire first
              e.stopPropagation();
            }}
            onDrop={(e) => handleNestedDrop(e, component.instanceId)}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverContainerId(component.instanceId);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragOverContainerId(null);
            }}
          >
            {hasChildren ? (
              component.children!.map(child => (
                <DraggableComponent
                  key={child.instanceId}
                  component={child}
                  isSelected={selectedComponentId === child.instanceId}
                  isInGridLayout={isGridLayout}
                  onSelect={handleComponentSelect}
                  onDoubleClick={handleComponentDoubleClick}
                >
                  <ResizableComponent
                    component={child}
                    isSelected={selectedComponentId === child.instanceId}
                    isInGridLayout={isGridLayout}
                  >
                    {renderComponent(child)}
                  </ResizableComponent>
                </DraggableComponent>
              ))
            ) : (
              <div className="no-children-placeholder">
                {isScrollable ? 'Drop components here to make them scrollable' : 'Drop UI components here'}
              </div>
            )}
          </div>
        </div>
      );
    }

    // For non-layout components, use the ComponentRenderer to render actual component with props
    return <ComponentRenderer component={component} isEditMode={isEditMode} />;
  };

  // Handle drop on nested container
  const handleNestedDrop = (e: React.DragEvent, parentContainerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainerId(null);

    console.log('Drop on container:', parentContainerId);

    try {
      // Check if this is an existing component being moved
      const existingComponentData = e.dataTransfer.getData('application/x-builder-component');
      console.log('Existing component data:', existingComponentData);

      if (existingComponentData) {
        const dragData = JSON.parse(existingComponentData);
        console.log('Parsed drag data:', dragData);
        if (dragData.isExisting && dragData.instanceId) {
          // Calculate insertion index based on drop position
          const parentComponent = currentPage?.components.find(c =>
            findComponentRecursive(c, parentContainerId)
          );

          let insertIndex: number | undefined = undefined;

          if (parentComponent) {
            const parent = findComponentRecursive(parentComponent, parentContainerId);
            if (parent && parent.children) {
              const dropY = e.clientY;

              // Find the insertion index by comparing Y positions
              insertIndex = parent.children.findIndex(child => {
                const childElement = document.querySelector(`[data-component-id="${child.instanceId}"]`);
                if (childElement) {
                  const rect = childElement.getBoundingClientRect();
                  const childMiddleY = rect.top + rect.height / 2;
                  return dropY < childMiddleY;
                }
                return false;
              });

              // If not found, append to end
              if (insertIndex === -1) {
                insertIndex = parent.children.length;
              }
            }
          }

          // Moving existing component to this container
          console.log('Reparenting', dragData.instanceId, 'to', parentContainerId, 'at index', insertIndex);
          reparentComponent(dragData.instanceId, parentContainerId, insertIndex);
          selectComponent(dragData.instanceId);
          onComponentSelect?.(dragData.instanceId);
          return;
        }
      }

      // Otherwise, this is a new component from the palette
      const data = e.dataTransfer.getData('application/json');
      if (!data) return;

      const componentEntry: ComponentRegistryEntry = JSON.parse(data);

      // Get component manifest for default props and styles
      const manifest = getManifest(componentEntry.pluginId, componentEntry.componentId);
      const parsedManifest = manifest || JSON.parse(componentEntry.componentManifest);

      const category = componentEntry.category?.toLowerCase() || '';

      // Check if this is a layout component being dropped into a container
      const isLayoutComponent = category === 'layout';

      // Create new component instance with the specific parent
      // Layout components inside containers should default to 100% width to fill parent
      const newComponent: ComponentInstance = {
        instanceId: `${componentEntry.componentId}-${Date.now()}`,
        pluginId: componentEntry.pluginId,
        componentId: componentEntry.componentId,
        componentCategory: category as any,
        parentId: parentContainerId,
        position: {
          row: 1,
          column: 1,
          rowSpan: 1,
          columnSpan: 1
        },
        size: {
          // Child layout containers should fill parent width by default
          width: isLayoutComponent ? '100%' : (parsedManifest.sizeConstraints?.defaultWidth || '200px'),
          height: parsedManifest.sizeConstraints?.defaultHeight || 'auto'
        },
        props: parsedManifest.defaultProps || {},
        styles: parsedManifest.defaultStyles || {},
        children: [],
        isVisible: true,
        zIndex: 1
      };

      addComponent(newComponent);
      selectComponent(newComponent.instanceId);
      onComponentSelect?.(newComponent.instanceId);
    } catch (error) {
      console.error('Failed to add component to nested container:', error);
    }
  };

  const gridStyles: React.CSSProperties = {
    gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
    gridAutoRows: gridConfig.minRowHeight,
    gap: gridConfig.gap
  };

  return (
    <>
    <div
      ref={canvasRef}
      className={`builder-canvas ${isDragOver ? 'drag-over' : ''} ${viewMode === 'preview' ? 'preview-mode' : 'edit-mode'}`}
      style={gridStyles}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleCanvasClick}
      onContextMenu={handleCanvasContextMenu}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Grid Background - only show when enabled */}
      {showGrid && <div className="grid-background" style={gridStyles}></div>}

      {/* Empty State */}
      {(!currentPage || currentPage.components.filter(c => !c.parentId).length === 0) && (
        <div className="empty-canvas-state">
          <div className="empty-state-icon">📐</div>
          <h3>Start Building Your Page</h3>
          <p>Add a <strong>Layout</strong> component first, then add UI components inside</p>
          <div className="empty-state-tips">
            <div className="tip">📦 Start with a Container or other layout</div>
            <div className="tip">💡 Drag to reposition components</div>
            <div className="tip">↔️ Resize by dragging the handles</div>
            <div className="tip">🎨 Customize styles in the properties panel</div>
          </div>
        </div>
      )}

      {/* Components - Only render root-level components (no parent) */}
      {currentPage?.components
        .filter(component => !component.parentId)
        .map(component => {
          // In preview mode, render without builder wrappers
          if (viewMode === 'preview') {
            // For height, only apply explicit pixel/percentage values, not 'auto'
            const previewHeight = component.size.height && component.size.height !== 'auto'
              ? component.size.height
              : undefined;

            // Apply maxWidth and centering if specified in props
            const maxWidth = component.props?.maxWidth;
            const centerContent = component.props?.centerContent;

            // For centering to work, we need maxWidth to be set
            // If centerContent is true but no maxWidth, use a default
            const effectiveMaxWidth = centerContent && !maxWidth ? '1200px' : maxWidth;

            // Root-level containers should always be 100% width in preview mode
            // They fill the viewport, with optional maxWidth for inner content
            return (
              <div
                key={component.instanceId}
                className="preview-component-wrapper"
                style={{
                  gridColumn: `1 / -1`, // Span all columns in preview mode
                  width: '100%', // Root containers always full width in preview
                  height: previewHeight,
                  // maxWidth is handled by inner layout-preview via props
                }}
              >
                {renderComponent(component)}
              </div>
            );
          }

          // In edit mode, wrap with drag/resize handlers
          return (
            <DraggableComponent
              key={component.instanceId}
              component={component}
              isSelected={selectedComponentId === component.instanceId}
              onSelect={handleComponentSelect}
              onDoubleClick={handleComponentDoubleClick}
            >
              <ResizableComponent
                component={component}
                isSelected={selectedComponentId === component.instanceId}
              >
                {renderComponent(component)}
              </ResizableComponent>
            </DraggableComponent>
          );
        })
      }

      {/* Drop Zone Indicator */}
      {isDragOver && (
        <div className="drop-zone-indicator">
          <div className="drop-zone-content">
            <span className="drop-icon">↓</span>
            <span>Drop component here</span>
          </div>
        </div>
      )}
    </div>

    {/* Canvas Context Menu - for right-click on empty canvas area */}
    {canvasContextMenu.isOpen && (
      <CanvasContextMenu
        x={canvasContextMenu.x}
        y={canvasContextMenu.y}
        onClose={handleCloseCanvasContextMenu}
      />
    )}
    </>
  );
};
