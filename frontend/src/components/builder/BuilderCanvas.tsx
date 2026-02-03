import React, { useRef, useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { ComponentInstance, ComponentRegistryEntry } from '../../types/builder';
import { DraggableComponent } from './DraggableComponent';
import { ResizableComponent } from './ResizableComponent';
import { ComponentRenderer } from './renderers';
import { CanvasContextMenu } from './CanvasContextMenu';
import { capabilityService } from '../../services/componentCapabilityService';
import { BREAKPOINTS, getBreakpointSettings, DEFAULT_RESPONSIVE_CONFIG, ResponsiveConfig } from '../../types/responsive';
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
  // Force preview mode regardless of store state - useful for standalone preview window
  forcePreviewMode?: boolean;
}

/**
 * BuilderCanvas - Main canvas where components are placed and arranged
 * Implements grid-based layout with drag-drop support
 */
export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({ onComponentSelect, pageOverride, forcePreviewMode = false }) => {
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
    setHoveredComponent,
    updateComponentProps
  } = useBuilderStore();

  // Use pageOverride if provided (for preview mode), otherwise use store's currentPage
  const currentPage = pageOverride !== undefined ? pageOverride : storeCurrentPage;

  // Effective viewMode - forcePreviewMode overrides store viewMode
  const effectiveViewMode = forcePreviewMode ? 'preview' : viewMode;

  const { getManifest } = useComponentStore();
  const { showGrid, activeBreakpoint, canvasWidth, showBreakpointIndicator } = useUIPreferencesStore();

  // Global hover tracking - single listener for entire canvas
  // This finds the innermost (closest) draggable component under the mouse
  useEffect(() => {
    if (effectiveViewMode !== 'edit') return;

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
  }, [effectiveViewMode, hoveredComponentId, setHoveredComponent]);

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

      // Get all container components (using capability service)
      const getAllContainerComponents = (components: ComponentInstance[]): ComponentInstance[] => {
        const containers: ComponentInstance[] = [];
        components.forEach(comp => {
          // Use capability service to check if component is a container
          if (capabilityService.isContainer(comp)) {
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

      // Find the most appropriate parent based on drop position using visual drop zones
      if (!isLayout || allLayoutComponents.length > 0) {
        // Non-layout components must have a layout parent
        // Layout components can optionally have a layout parent (for nesting)

        // Use the currently highlighted drop zone container if available
        if (dragOverContainerId) {
          const targetContainer = allLayoutComponents.find(c => c.instanceId === dragOverContainerId);
          if (targetContainer) {
            parentLayout = targetContainer;
            console.log(`[BuilderCanvas] Using highlighted container: ${dragOverContainerId}`);
          }
        }

        // If no container is highlighted, find the deepest container under the mouse
        if (!parentLayout) {
          const mouseX = e.clientX;
          const mouseY = e.clientY;

          // Find container elements and check which ones contain the drop point
          // Sort by depth (most nested first) to get the most specific parent
          const candidateContainers: Array<{component: ComponentInstance, depth: number, element: Element}> = [];

          allLayoutComponents.forEach(comp => {
            const containerEl = document.querySelector(`[data-component-id="${comp.instanceId}"]`);
            if (containerEl) {
              const rect = containerEl.getBoundingClientRect();
              if (mouseX >= rect.left && mouseX <= rect.right &&
                  mouseY >= rect.top && mouseY <= rect.bottom) {
                // Calculate depth by counting parent containers
                let depth = 0;
                let current = comp;
                while (current.parentId) {
                  depth++;
                  const parent = allLayoutComponents.find(c => c.instanceId === current.parentId);
                  if (parent) current = parent;
                  else break;
                }
                candidateContainers.push({ component: comp, depth, element: containerEl });
              }
            }
          });

          // Use the deepest (most nested) container
          if (candidateContainers.length > 0) {
            candidateContainers.sort((a, b) => b.depth - a.depth);
            parentLayout = candidateContainers[0].component;
            console.log(`[BuilderCanvas] Auto-selected container: ${parentLayout.instanceId} (depth: ${candidateContainers[0].depth})`);
          } else {
            // Fallback to first layout if no container contains the drop point
            parentLayout = allLayoutComponents[0] || null;
          }
        }
      }

      // Clear drop zone highlight
      setDragOverContainerId(null);

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

    // Find the container under the mouse cursor for visual drop zone highlighting
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Get all container elements (layout and data containers)
    const containerElements = document.querySelectorAll('[data-is-container="true"]');
    let deepestContainer: { id: string; depth: number } | null = null;

    containerElements.forEach(containerEl => {
      const rect = containerEl.getBoundingClientRect();
      if (mouseX >= rect.left && mouseX <= rect.right &&
          mouseY >= rect.top && mouseY <= rect.bottom) {
        const containerId = containerEl.getAttribute('data-component-id');
        if (containerId) {
          // Calculate depth by counting parent containers
          let depth = 0;
          let current = containerEl.parentElement;
          while (current) {
            if (current.hasAttribute('data-is-container')) {
              depth++;
            }
            current = current.parentElement;
          }

          if (!deepestContainer || depth > deepestContainer.depth) {
            deepestContainer = { id: containerId, depth };
          }
        }
      }
    });

    // Update the highlighted container
    const newContainerId = deepestContainer?.id || null;
    if (newContainerId !== dragOverContainerId) {
      setDragOverContainerId(newContainerId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverContainerId(null);
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
    if (effectiveViewMode !== 'edit') return;

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
      // Asymmetric 2-column layouts
      case 'grid-20-80':
        return {
          display: 'grid',
          gridTemplateColumns: '20% 80%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-25-75':
        return {
          display: 'grid',
          gridTemplateColumns: '25% 75%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-33-67':
        return {
          display: 'grid',
          gridTemplateColumns: '33.33% 66.67%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-40-60':
        return {
          display: 'grid',
          gridTemplateColumns: '40% 60%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-60-40':
        return {
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-67-33':
        return {
          display: 'grid',
          gridTemplateColumns: '66.67% 33.33%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-75-25':
        return {
          display: 'grid',
          gridTemplateColumns: '75% 25%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'grid-80-20':
        return {
          display: 'grid',
          gridTemplateColumns: '80% 20%',
          alignItems: 'start',
          alignContent: 'start',
        };
      case 'flex-column':
      default:
        return {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start', // Changed from 'stretch' to allow child components to have custom widths
        };
    }
  };

  // Render component using the ComponentRenderer system
  const renderComponent = (component: ComponentInstance) => {
    // Use capability service to check if component is a container
    const isContainer = capabilityService.isContainer(component);
    // Check if component is a data container (like Repeater) - has data source capability
    const isDataContainerComponent = capabilityService.hasDataSource(component);
    const hasChildren = component.children && component.children.length > 0;
    const isEditMode = effectiveViewMode === 'edit';

    // SPECIAL CASE: PageLayout has its own visual wireframe renderer with slot-based drop zones
    if (component.componentId === 'PageLayout') {
      // In preview mode, delegate to ComponentRenderer
      if (!isEditMode) {
        return (
          <ComponentRenderer
            component={component}
            isEditMode={isEditMode}
          />
        );
      }

      // In edit mode, render the visual wireframe with drop zones for each slot
      const gap = component.props?.gap || '4px';
      const backgroundColor = component.styles?.backgroundColor || '#f8f9fa';

      // Extract sticky header/footer props for display in header bar
      const stickyHeader = component.props?.stickyHeader || false;
      const stickyFooter = component.props?.stickyFooter || false;

      // Get responsive settings for the active breakpoint
      const responsiveConfig = component.props?.responsive as ResponsiveConfig | undefined;
      const breakpointSettings = getBreakpointSettings(responsiveConfig, activeBreakpoint);
      const { slotVisibility, stackSidebars } = breakpointSettings;

      // Get sidebar ratio - use breakpoint-specific ratio if available, otherwise component default
      const sidebarRatio = breakpointSettings.sidebarRatio || component.props?.sidebarRatio || '30-70';
      const [leftPercent, centerPercent] = sidebarRatio.split('-').map((s: string) => parseInt(s, 10));

      // Group children by their assigned slot
      const children = component.children || [];
      const slottedChildren: Record<string, ComponentInstance[]> = {
        header: [],
        footer: [],
        left: [],
        right: [],
        center: []
      };
      children.forEach(child => {
        const slot = child.props?.slot || 'center';
        if (slottedChildren[slot]) {
          slottedChildren[slot].push(child);
        } else {
          slottedChildren.center.push(child);
        }
      });

      const hasHeader = slottedChildren.header.length > 0;
      const hasFooter = slottedChildren.footer.length > 0;
      const hasLeft = slottedChildren.left.length > 0;
      const hasRight = slottedChildren.right.length > 0;
      const hasCenter = slottedChildren.center.length > 0;

      // Check if slots are visible at current breakpoint
      const isHeaderVisible = slotVisibility.header;
      const isFooterVisible = slotVisibility.footer;
      const isCenterVisible = slotVisibility.center;
      const isRightVisible = slotVisibility.right;

      // For left sidebar, respect the visibility setting directly like other slots
      // The mobileSidebarBehavior prop affects how visible sidebars are displayed, not whether they're visible
      const isLeftVisible = slotVisibility.left;

      // Common styles for regions - overflow hidden to constrain children within slot boundaries
      const regionStyle: React.CSSProperties = {
        border: '1px solid #dee2e6',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'flex-start',
        position: 'relative',
        minHeight: '60px',
        padding: '8px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      };

      const labelStyle: React.CSSProperties = {
        color: '#6c757d',
        fontSize: '14px',
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        pointerEvents: 'none',
        textAlign: 'center',
        padding: '20px 0',
      };

      const hasContentIndicator: React.CSSProperties = {
        position: 'absolute',
        top: '4px',
        right: '4px',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: '#28a745',
        zIndex: 10,
      };

      // Render children for a specific slot - children fill width, constrained to parent
      const renderSlotContent = (slot: string) => {
        const slotChildren = slottedChildren[slot] || [];
        if (slotChildren.length === 0) return null;

        return slotChildren.map(child => (
          <div
            key={child.instanceId}
            className="slot-child-wrapper"
            style={{
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              boxSizing: 'border-box',
            }}
            // Handle clicks on the wrapper (including box-shadow border area)
            // This ensures the child gets selected even when clicking outside its DraggableComponent
            onClick={(e) => {
              e.stopPropagation();
              handleComponentSelect(child.instanceId);
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleComponentSelect(child.instanceId);
            }}
          >
            <DraggableComponent
              component={child}
              isSelected={selectedComponentId === child.instanceId}
              isInGridLayout={false}
              isDropTarget={dragOverContainerId === child.instanceId}
              onSelect={handleComponentSelect}
              onDoubleClick={handleComponentDoubleClick}
            >
              <ResizableComponent
                component={child}
                isSelected={selectedComponentId === child.instanceId}
                isInGridLayout={false}
              >
                {renderComponent(child)}
              </ResizableComponent>
            </DraggableComponent>
          </div>
        ));
      };

      // Create drop zone handlers
      const createDropZoneProps = (slot: string) => ({
        onDrop: (e: React.DragEvent) => handlePageLayoutSlotDrop(e, component.instanceId, slot),
        onDragOver: (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverContainerId(`${component.instanceId}-${slot}`);
        },
        onDragLeave: (e: React.DragEvent) => {
          e.preventDefault();
          e.stopPropagation();
          setDragOverContainerId(null);
        },
        // Stop click/mousedown propagation in slots to prevent PageLayout from being selected
        // when clicking inside a slot (children handle their own selection via stopPropagation)
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
        onMouseDown: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
      });

      const isSlotDragOver = (slot: string) => dragOverContainerId === `${component.instanceId}-${slot}`;

      // Styles for hidden slots (dimmed, with "Hidden" label)
      const hiddenSlotStyle: React.CSSProperties = {
        ...regionStyle,
        opacity: 0.4,
        backgroundColor: '#f0f0f0',
        border: '1px dashed #999',
      };

      const hiddenLabelStyle: React.CSSProperties = {
        ...labelStyle,
        fontSize: '11px',
        color: '#999',
      };

      // Render a slot region with visibility awareness
      const renderSlotRegion = (
        slotName: string,
        label: string,
        isVisible: boolean,
        hasContent: boolean,
        extraStyles: React.CSSProperties = {}
      ) => {
        const isHidden = !isVisible;
        const slotStyle = isHidden ? { ...hiddenSlotStyle, ...extraStyles } : { ...regionStyle, ...extraStyles };

        return (
          <div
            className={`page-layout-region page-layout-${slotName} ${isSlotDragOver(slotName) ? 'drag-over' : ''} ${isHidden ? 'slot-hidden' : ''}`}
            style={slotStyle}
            data-slot={slotName}
            {...createDropZoneProps(slotName)}
          >
            {/* Show green indicator when slot has content (visible or hidden) */}
            {hasContent && <div style={hasContentIndicator} title="Has content" />}

            {/* Show label/hidden message when: slot is hidden OR slot is visible but empty */}
            {(isHidden || !hasContent) && (
              <div style={isHidden ? hiddenLabelStyle : labelStyle}>
                {isHidden ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span>{label}</span>
                    <span style={{ fontSize: '10px', marginTop: '2px', fontStyle: 'italic' }}>
                      Hidden on {BREAKPOINTS[activeBreakpoint].label}
                    </span>
                  </div>
                ) : (
                  label
                )}
              </div>
            )}

            {/* Only render children when slot is visible AND has content */}
            {!isHidden && hasContent && (
              <div style={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden', boxSizing: 'border-box' }}>
                {renderSlotContent(slotName)}
              </div>
            )}
          </div>
        );
      };

      // Use flexbox layout for better auto-height behavior
      // When stackSidebars is true, render in a single column layout
      return (
        <div
          className={`page-layout-container edit-mode ${stackSidebars ? 'stacked-layout' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap,
            backgroundColor,
            width: '100%',
            maxWidth: '100%',
            minHeight: '400px',
            border: '2px solid #dee2e6',
            borderRadius: '8px',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
          data-component-type="PageLayout"
          data-active-breakpoint={activeBreakpoint}
        >
          {/* Selectable header bar for PageLayout - allows selecting the component */}
          <div
            className="page-layout-header-bar"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#e8f4fd',
              borderBottom: '1px solid #bee3f8',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            // Don't stop propagation - let clicks bubble up to DraggableComponent
            // so the PageLayout can be selected when clicking this header
          >
            <span style={{ fontWeight: 600, color: '#2b6cb0', fontSize: '14px' }}>
              PageLayout
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                background: '#3182ce',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: '12px',
                textTransform: 'uppercase',
              }}
            >
              Layout
            </span>
            {stackSidebars && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#6c757d',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 500,
                  borderRadius: '12px',
                }}
              >
                stacked
              </span>
            )}
            {stickyHeader && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#38a169',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 500,
                  borderRadius: '12px',
                }}
              >
                sticky header
              </span>
            )}
            {stickyFooter && (
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: '#38a169',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 500,
                  borderRadius: '12px',
                }}
              >
                sticky footer
              </span>
            )}
          </div>

          {/* Header Slot */}
          {renderSlotRegion('header', 'HEADER', isHeaderVisible, hasHeader, { width: '100%', flexShrink: 0 })}

          {/* Middle section - depends on stackSidebars setting */}
          {stackSidebars ? (
            // Stacked layout: All slots in a column
            <>
              {renderSlotRegion('left', 'LEFT PANEL', isLeftVisible, hasLeft, { width: '100%', minHeight: '100px' })}
              {renderSlotRegion('center', 'CONTENT PANEL', isCenterVisible, hasCenter, { width: '100%', flex: 1, minHeight: '150px' })}
              {renderSlotRegion('right', 'RIGHT PANEL', isRightVisible, hasRight, { width: '100%', minHeight: '100px' })}
            </>
          ) : (
            // Side-by-side layout: Left + Center + Right in a row
            // Calculate widths based on which slots are visible
            (() => {
              // Determine effective widths based on visibility
              // When right is hidden: left takes leftPercent, center takes rest
              // When left is hidden: center takes full width (or shares with right)
              // When all visible: use configured ratios
              let leftWidthStyle: React.CSSProperties = {};
              let centerWidthStyle: React.CSSProperties = {};
              let rightWidthStyle: React.CSSProperties = {};

              if (isLeftVisible && isRightVisible) {
                // All three visible - use percentage ratios
                leftWidthStyle = { width: `${leftPercent}%`, flexShrink: 0 };
                centerWidthStyle = { flex: 1 };
                rightWidthStyle = { width: '250px', flexShrink: 0 };
              } else if (isLeftVisible && !isRightVisible) {
                // Left and center only
                leftWidthStyle = { width: `${leftPercent}%`, flexShrink: 0 };
                centerWidthStyle = { flex: 1 };
                rightWidthStyle = { display: 'none' };
              } else if (!isLeftVisible && isRightVisible) {
                // Center and right only
                leftWidthStyle = { display: 'none' };
                centerWidthStyle = { flex: 1 };
                rightWidthStyle = { width: '250px', flexShrink: 0 };
              } else {
                // Center only
                leftWidthStyle = { display: 'none' };
                centerWidthStyle = { flex: 1, width: '100%' };
                rightWidthStyle = { display: 'none' };
              }

              return (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap,
                    flex: 1,
                    minHeight: '200px',
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}
                >
                  {renderSlotRegion('left', 'LEFT\nSide Panel', isLeftVisible, hasLeft, { ...leftWidthStyle, overflow: 'hidden' })}
                  {renderSlotRegion('center', 'CONTENT PANEL', isCenterVisible, hasCenter, { ...centerWidthStyle, overflow: 'hidden' })}
                  {renderSlotRegion('right', 'RIGHT\nSide Panel', isRightVisible, hasRight, { ...rightWidthStyle, overflow: 'hidden' })}
                </div>
              );
            })()
          )}

          {/* Footer */}
          {renderSlotRegion('footer', 'FOOTER', isFooterVisible, hasFooter, { width: '100%', flexShrink: 0 })}
        </div>
      );
    }

    // For container components, render container with children
    if (isContainer) {
      // Get layout type from component props - layoutMode is primary (set by UI), layoutType is fallback
      const layoutType = component.props?.layoutMode || component.props?.layoutType || 'flex-column';
      const layoutStyles = getLayoutStyles(layoutType);

      // In preview mode, render clean layout without builder chrome
      if (!isEditMode) {
        // Get heightMode prop for containers (affects height and overflow behavior)
        const previewHeightMode = component.props?.heightMode as string | undefined;

        // Calculate height based on heightMode
        // Priority: explicit props height > heightMode > stored size
        const propsHeight = component.props?.height as string | undefined;
        let previewHeight: string | undefined;

        if (propsHeight) {
          // Explicit height from Properties panel
          previewHeight = propsHeight;
        } else if (previewHeightMode === 'wrap') {
          // Wrap mode: auto height to expand with content
          previewHeight = 'auto';
        } else if (previewHeightMode === 'fill') {
          // Fill mode: 100% of parent height
          previewHeight = '100%';
        } else if (component.size.height && component.size.height !== 'auto') {
          // Resizable mode or explicit stored height
          previewHeight = component.size.height;
        }
        // If no height determined, leave undefined (natural sizing)

        // Get overflow based on heightMode
        // wrap = visible (expand with content), fill/resizable = auto (scroll on overflow)
        const getPreviewOverflow = (): React.CSSProperties => {
          if (previewHeightMode === 'wrap') {
            return { overflow: 'visible' as const };
          }
          // For fill and resizable modes, enable scrolling when content overflows
          return { overflow: 'auto' as const };
        };

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

        // Extract styles excluding width, maxWidth, and overflow - these should be controlled by props/heightMode
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { width: _ignoredWidth, maxWidth: _ignoredMaxWidth, overflow: _ignoredOverflow, ...stylesWithoutWidth } = component.styles || {};

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
              ...getPreviewOverflow(),
            }}
          >
            {hasChildren && component.children!.map(child => {
              // Check if child is also a layout component
              const childIsLayout = child.componentCategory?.toLowerCase() === 'layout';

              // For non-layout children (Image, Label, Navbar, etc.)
              if (!childIsLayout) {
                // Helper to check if a dimension is an explicit pixel value (from resize)
                const isPixelValue = (value: string | undefined): boolean => {
                  if (!value) return false;
                  return value.endsWith('px') && !isNaN(parseFloat(value));
                };

                // Only Image components should preserve their resized pixel dimensions
                // Other UI components (Navbar, Button, Label, etc.) should fill width naturally
                const isImageComponent = child.componentId?.toLowerCase().includes('image');

                // For Image: use stored pixel dimensions if available
                // For other components: always use 100% width to fill parent
                const childWidth = isImageComponent && isPixelValue(child.size.width)
                  ? child.size.width
                  : undefined;
                const childHeight = isImageComponent && isPixelValue(child.size.height)
                  ? child.size.height
                  : undefined;

                return (
                  <div
                    key={child.instanceId}
                    className="leaf-child-wrapper"
                    style={{
                      width: childWidth || (isFlexRow ? undefined : '100%'),
                      height: childHeight,
                      flex: isFlexRow && !childWidth ? '1' : undefined,
                    }}
                  >
                    {renderComponent(child)}
                  </div>
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

      // Get heightMode prop for containers (affects overflow behavior)
      const heightMode = component.props?.heightMode as string | undefined;

      // Get overflow styles based on scrollable type and heightMode
      const getScrollOverflow = () => {
        if (isScrollable) {
          // Scrollable containers always use their scroll direction
          switch (scrollDirection) {
            case 'horizontal':
              return { overflowX: 'auto' as const, overflowY: 'hidden' as const };
            case 'both':
              return { overflowX: 'auto' as const, overflowY: 'auto' as const };
            case 'vertical':
            default:
              return { overflowX: 'hidden' as const, overflowY: 'auto' as const };
          }
        }

        // For regular containers, overflow depends on heightMode:
        // - 'wrap': visible (allows container to expand with content)
        // - 'fill'/'resizable': auto (allows scrolling when content overflows)
        if (heightMode === 'wrap') {
          return { overflow: 'visible' as const };
        }
        // Default to auto - enables scrolling when content overflows
        return { overflow: 'auto' as const };
      };

      return (
        <div
          className={`component-placeholder layout-placeholder ${isScrollable ? 'scrollable-layout' : ''} ${isDataContainerComponent ? 'data-container' : ''}`}
          style={{
            ...component.styles,
            height: isScrollable ? containerHeight : undefined,
          }}
          // Don't stop propagation here - let clicks bubble up to DraggableComponent
          // so the container can be selected when clicking on its background
        >
          <div
            className="placeholder-header"
            // Don't stop propagation - let clicks bubble up to DraggableComponent
            // so clicking the header selects this container
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
              // For data containers or scrollable containers, use flex: 1 to fill available space
              // This ensures children-container expands when parent is resized
              flex: (isDataContainerComponent || isScrollable) ? 1 : undefined,
              minHeight: (isScrollable && !isGridLayout) ? 0 : undefined, // Allow flex shrinking only for flex layouts
              scrollBehavior: component.props?.smoothScroll ? 'smooth' : 'auto',
            }}
            // Don't stop propagation on click - let it bubble up to DraggableComponent
            // When clicking on this container's background (not on a child), the container should get selected
            // Child DraggableComponents handle their own clicks and call stopPropagation there
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
                  isDropTarget={dragOverContainerId === child.instanceId}
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
          // Find the component being dragged
          const draggedComponent = useBuilderStore.getState().findComponent(dragData.instanceId);
          const isSameParent = draggedComponent?.parentId === parentContainerId;

          // Calculate insertion index based on drop position
          const parentComponent = currentPage?.components.find(c =>
            findComponentRecursive(c, parentContainerId)
          );

          let insertIndex: number | undefined = undefined;
          let currentIndex = -1;

          if (parentComponent) {
            const parent = findComponentRecursive(parentComponent, parentContainerId);
            if (parent && parent.children) {
              const dropY = e.clientY;

              // Find current index of the dragged component (if in same parent)
              if (isSameParent) {
                currentIndex = parent.children.findIndex(child => child.instanceId === dragData.instanceId);
              }

              // Find the insertion index by comparing Y positions
              insertIndex = parent.children.findIndex(child => {
                // Skip the component being dragged for accurate position calculation
                if (child.instanceId === dragData.instanceId) return false;
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

              // Adjust index if moving within same parent
              // When removing from original position, indices shift
              if (isSameParent && currentIndex !== -1 && currentIndex < insertIndex) {
                insertIndex--;
              }
            }
          }

          // Moving existing component
          console.log('Moving', dragData.instanceId, 'to', parentContainerId, 'at index', insertIndex, 'isSameParent:', isSameParent);

          if (isSameParent && insertIndex !== undefined) {
            // Use moveComponentToIndex for reordering within same parent
            useBuilderStore.getState().moveComponentToIndex(dragData.instanceId, insertIndex);
          } else {
            // Use reparentComponent for moving between containers
            reparentComponent(dragData.instanceId, parentContainerId, insertIndex);
          }

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
      // Non-layout components (Label, Button, etc.) should also fill width and use auto height
      const getDefaultChildWidth = (): string => {
        if (isLayoutComponent) return '100%';
        if (parsedManifest.sizeConstraints?.defaultWidth) return parsedManifest.sizeConstraints.defaultWidth;
        // UI components default to 100% width in flex-column containers
        return '100%';
      };

      const getDefaultChildHeight = (): string => {
        if (parsedManifest.sizeConstraints?.defaultHeight) return parsedManifest.sizeConstraints.defaultHeight;
        // Use 'auto' to let component size naturally to its content
        return 'auto';
      };

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
          width: getDefaultChildWidth(),
          height: getDefaultChildHeight()
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

  // Handle drop on PageLayout slot (header, footer, left, right, center)
  // This is similar to handleNestedDrop but also sets the 'slot' prop on the dropped component
  const handlePageLayoutSlotDrop = (e: React.DragEvent, pageLayoutId: string, slot: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainerId(null);

    console.log('Drop on PageLayout slot:', pageLayoutId, slot);

    try {
      // Check if this is an existing component being moved
      const existingComponentData = e.dataTransfer.getData('application/x-builder-component');

      if (existingComponentData) {
        const dragData = JSON.parse(existingComponentData);
        if (dragData.isExisting && dragData.instanceId) {
          // Move existing component to this slot
          reparentComponent(dragData.instanceId, pageLayoutId);
          // Update the slot prop on the moved component
          const movedComponent = useBuilderStore.getState().findComponent(dragData.instanceId);
          if (movedComponent) {
            updateComponentProps(dragData.instanceId, {
              ...movedComponent.props,
              slot: slot
            });
          }
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

      // Create new component instance with the slot prop set
      const newComponent: ComponentInstance = {
        instanceId: `${componentEntry.componentId}-${Date.now()}`,
        pluginId: componentEntry.pluginId,
        componentId: componentEntry.componentId,
        componentCategory: category as any,
        parentId: pageLayoutId,
        position: {
          row: 1,
          column: 1,
          rowSpan: 1,
          columnSpan: 1
        },
        size: {
          width: '100%',
          height: 'auto'
        },
        props: {
          ...(parsedManifest.defaultProps || {}),
          slot: slot  // Set the slot prop
        },
        styles: parsedManifest.defaultStyles || {},
        children: [],
        isVisible: true,
        zIndex: 1
      };

      addComponent(newComponent);
      selectComponent(newComponent.instanceId);
      onComponentSelect?.(newComponent.instanceId);
    } catch (error) {
      console.error('Failed to add component to PageLayout slot:', error);
    }
  };

  const gridStyles: React.CSSProperties = {
    gridTemplateColumns: `repeat(${gridConfig.columns}, 1fr)`,
    gridAutoRows: gridConfig.minRowHeight,
    gap: gridConfig.gap
  };

  // Get current breakpoint info for indicator
  const currentBreakpointDef = BREAKPOINTS[activeBreakpoint];
  const isWidthConstrained = canvasWidth !== null && effectiveViewMode === 'edit';

  return (
    <>
    {/* Canvas outer container for responsive width simulation */}
    <div className={`canvas-responsive-wrapper ${isWidthConstrained ? 'width-constrained' : ''}`}>
      {/* Breakpoint indicator */}
      {showBreakpointIndicator && effectiveViewMode === 'edit' && (
        <div className="breakpoint-indicator">
          <span className="breakpoint-indicator-icon">{currentBreakpointDef.icon}</span>
          <span className="breakpoint-indicator-label">{currentBreakpointDef.label}</span>
          {canvasWidth && (
            <span className="breakpoint-indicator-width">({canvasWidth}px)</span>
          )}
        </div>
      )}

      {/* Canvas container with constrained width */}
      <div
        className="canvas-width-container"
        style={{
          maxWidth: isWidthConstrained ? `${canvasWidth}px` : '100%',
          transition: 'max-width 0.3s ease',
        }}
      >
        <div
          ref={canvasRef}
          className={`builder-canvas ${isDragOver ? 'drag-over' : ''} ${effectiveViewMode === 'preview' ? 'preview-mode' : 'edit-mode'}`}
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
          if (effectiveViewMode === 'preview') {
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
              isDropTarget={dragOverContainerId === component.instanceId}
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
      </div>
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
