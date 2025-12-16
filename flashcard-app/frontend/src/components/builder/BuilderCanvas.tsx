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

  const {
    currentPage,
    selectedComponentId,
    gridConfig,
    viewMode,
    addComponent,
    selectComponent,
    removeComponent
  } = useBuilderStore();

  const { getManifest } = useComponentStore();

  // Handle drop from component palette
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const data = e.dataTransfer.getData('application/json');
      const componentEntry: ComponentRegistryEntry = JSON.parse(data);

      // Get component manifest for default props and styles
      const manifest = getManifest(componentEntry.pluginId, componentEntry.componentId);
      const parsedManifest = manifest || JSON.parse(componentEntry.componentManifest);

      // Get component category
      const category = componentEntry.category?.toLowerCase() || '';
      const isLayout = category === 'layout';

      // Enforce layout-first rule: Only layouts can be dropped directly on canvas
      let parentLayout: ComponentInstance | null = null;

      if (!isLayout) {
        // Check if there are any layout components on the canvas
        const layoutComponents = currentPage?.components.filter(comp =>
          comp.componentCategory?.toLowerCase() === 'layout'
        ) || [];

        if (layoutComponents.length === 0) {
          alert('Please add a layout component first before adding UI components.');
          return;
        }

        // Automatically assign to the first available layout as parent
        parentLayout = layoutComponents[0];
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
          <div className="children-container">
            {hasChildren ? (
              component.children!.map(child => (
                <div key={child.instanceId} className="child-component">
                  {renderComponent(child)}
                </div>
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
