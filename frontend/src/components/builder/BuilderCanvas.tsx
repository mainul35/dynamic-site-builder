import React, { useRef, useState } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { ComponentInstance, ComponentRegistryEntry } from '../../types/builder';
import { DraggableComponent } from './DraggableComponent';
import { ResizableComponent } from './ResizableComponent';
import './BuilderCanvas.css';

interface BuilderCanvasProps {
  onComponentSelect?: (componentId: string | null) => void;
}

/**
 * BuilderCanvas - Main canvas where components are placed and arranged
 * Implements grid-based layout with drag-drop support
 */
export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ onComponentSelect }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);

  const {
    currentPage,
    selectedComponentId,
    gridConfig,
    viewMode,
    addComponent,
    selectComponent,
    removeComponent,
    reparentComponent
  } = useBuilderStore();

  const { getManifest } = useComponentStore();

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

      // Get all layout components (including nested ones)
      const getAllLayoutComponents = (components: ComponentInstance[]): ComponentInstance[] => {
        const layouts: ComponentInstance[] = [];
        components.forEach(comp => {
          if (comp.componentCategory?.toLowerCase() === 'layout') {
            layouts.push(comp);
            if (comp.children && comp.children.length > 0) {
              layouts.push(...getAllLayoutComponents(comp.children));
            }
          }
        });
        return layouts;
      };

      const allLayoutComponents = getAllLayoutComponents(currentPage?.components || []);

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

  // Render a placeholder component (will be replaced with actual plugin components later)
  const renderComponent = (component: ComponentInstance) => {
    const isLayout = component.componentCategory?.toLowerCase() === 'layout';
    const hasChildren = component.children && component.children.length > 0;
    const isEditMode = viewMode === 'edit';

    // In preview mode, render clean component without builder chrome
    if (!isEditMode) {
      return (
        <div
          className="component-preview"
          style={component.styles}
        >
          {isLayout && hasChildren && (
            <div className="children-preview">
              {component.children!.map(child => (
                <div key={child.instanceId}>
                  {renderComponent(child)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Edit mode: Show builder chrome with labels and props
    return (
      <div
        className={`component-placeholder ${isLayout ? 'layout-placeholder' : ''}`}
        style={component.styles}
      >
        <div className="placeholder-header">
          <span className="placeholder-id">{component.componentId}</span>
          {isLayout && <span className="layout-badge">Layout</span>}
        </div>
        <div className="placeholder-props">
          {Object.entries(component.props).map(([key, value]) => (
            <div key={key} className="prop-item">
              <strong>{key}:</strong> {String(value)}
            </div>
          ))}
        </div>

        {/* Render children for layout components */}
        {isLayout && (
          <div
            className={`children-container ${dragOverContainerId === component.instanceId ? 'drag-over' : ''}`}
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
                  onSelect={handleComponentSelect}
                  onDoubleClick={handleComponentDoubleClick}
                >
                  <ResizableComponent
                    component={child}
                    isSelected={selectedComponentId === child.instanceId}
                  >
                    {renderComponent(child)}
                  </ResizableComponent>
                </DraggableComponent>
              ))
            ) : (
              <div className="no-children-placeholder">
                Drop UI components here
              </div>
            )}
          </div>
        )}
      </div>
    );
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

      // Create new component instance with the specific parent
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
    <div
      ref={canvasRef}
      className={`builder-canvas ${isDragOver ? 'drag-over' : ''} ${viewMode === 'preview' ? 'preview-mode' : 'edit-mode'}`}
      style={gridStyles}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleCanvasClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Grid Background */}
      <div className="grid-background" style={gridStyles}></div>

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
        .map(component => (
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
        ))
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
  );
};
