import { create } from 'zustand';
import {
  PageDefinition,
  ComponentInstance,
  GridConfig,
  ViewMode,
  HistoryEntry
} from '../types/builder';

/**
 * Builder state interface
 */
interface BuilderState {
  // Current page being edited
  currentPage: PageDefinition | null;

  // Selected component for editing
  selectedComponentId: string | null;

  // Hovered component (for hover highlighting - only one at a time)
  hoveredComponentId: string | null;

  // Undo/redo stacks
  history: HistoryEntry[];
  historyIndex: number;

  // Grid configuration
  gridConfig: GridConfig;

  // View mode
  viewMode: ViewMode;

  // Loading state
  isLoading: boolean;

  // Error state
  error: string | null;

  // Actions
  setCurrentPage: (page: PageDefinition) => void;
  selectComponent: (componentId: string | null) => void;
  setHoveredComponent: (componentId: string | null) => void;
  addComponent: (component: ComponentInstance) => void;
  updateComponent: (componentId: string, updates: Partial<ComponentInstance>) => void;
  removeComponent: (componentId: string) => void;
  updateComponentStyles: (componentId: string, styles: Record<string, string>) => void;
  updateComponentProps: (componentId: string, props: Record<string, any>) => void;
  moveComponent: (componentId: string, newPosition: ComponentInstance['position']) => void;
  resizeComponent: (componentId: string, newSize: ComponentInstance['size']) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setViewMode: (mode: ViewMode) => void;
  saveSnapshot: (description?: string) => void;
  setGridConfig: (config: Partial<GridConfig>) => void;
  clearPage: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  duplicateComponent: (componentId: string) => void;
  findComponent: (componentId: string) => ComponentInstance | null;
  reparentComponent: (componentId: string, newParentId: string | null, insertIndex?: number) => void;
  reorderComponent: (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  moveComponentToIndex: (componentId: string, newIndex: number) => void;
}

/**
 * Default grid configuration
 */
const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  rows: 'auto',
  gap: '20px',
  minRowHeight: '50px'
};

/**
 * Create builder store using Zustand
 */
export const useBuilderStore = create<BuilderState>((set, get) => ({
  currentPage: null,
  selectedComponentId: null,
  hoveredComponentId: null,
  history: [],
  historyIndex: -1,
  gridConfig: DEFAULT_GRID_CONFIG,
  viewMode: 'edit',
  isLoading: false,
  error: null,

  /**
   * Set the current page
   */
  setCurrentPage: (page: PageDefinition) => {
    set({
      currentPage: page,
      history: [{
        pageDefinition: page,
        timestamp: Date.now()
      }],
      historyIndex: 0,
      selectedComponentId: null
    });
  },

  /**
   * Select a component for editing
   */
  selectComponent: (componentId: string | null) => {
    set({ selectedComponentId: componentId });
  },

  /**
   * Set hovered component (global tracking - only one at a time)
   */
  setHoveredComponent: (componentId: string | null) => {
    set({ hoveredComponentId: componentId });
  },

  /**
   * Add a new component to the page (recursively searches for parent)
   */
  addComponent: (component: ComponentInstance) => {
    const { currentPage } = get();
    if (!currentPage) return;

    let updatedComponents = [...currentPage.components];

    // If component has a parent, add it to parent's children array (search recursively)
    if (component.parentId) {
      const addToParent = (components: ComponentInstance[]): ComponentInstance[] => {
        return components.map(comp => {
          if (comp.instanceId === component.parentId) {
            // Found the parent, add component to its children
            return {
              ...comp,
              children: [...(comp.children || []), component]
            };
          }
          // Not the parent, but check if parent is in this component's children
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: addToParent(comp.children)
            };
          }
          return comp;
        });
      };

      updatedComponents = addToParent(updatedComponents);
    } else {
      // Root level component, add to components array
      updatedComponents.push(component);
    }

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: updatedComponents
    };

    set({ currentPage: updatedPage });
    get().saveSnapshot(`Added component ${component.componentId}`);
  },

  /**
   * Update a component (recursively searches children)
   */
  updateComponent: (componentId: string, updates: Partial<ComponentInstance>) => {
    const { currentPage } = get();
    if (!currentPage) return;

    const updateInComponents = (components: ComponentInstance[]): ComponentInstance[] => {
      return components.map(comp => {
        if (comp.instanceId === componentId) {
          return { ...comp, ...updates };
        }
        if (comp.children && comp.children.length > 0) {
          return {
            ...comp,
            children: updateInComponents(comp.children)
          };
        }
        return comp;
      });
    };

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: updateInComponents(currentPage.components)
    };

    set({ currentPage: updatedPage });
    get().saveSnapshot(`Updated component ${componentId}`);
  },

  /**
   * Remove a component from the page (recursively searches children)
   */
  removeComponent: (componentId: string) => {
    const { currentPage } = get();
    if (!currentPage) return;

    const removeFromComponents = (components: ComponentInstance[]): ComponentInstance[] => {
      return components
        .filter(comp => comp.instanceId !== componentId)
        .map(comp => {
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: removeFromComponents(comp.children)
            };
          }
          return comp;
        });
    };

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: removeFromComponents(currentPage.components)
    };

    set({
      currentPage: updatedPage,
      selectedComponentId: null
    });
    get().saveSnapshot(`Removed component ${componentId}`);
  },

  /**
   * Update component styles
   */
  updateComponentStyles: (componentId: string, styles: Record<string, string>) => {
    get().updateComponent(componentId, { styles });
  },

  /**
   * Update component props
   */
  updateComponentProps: (componentId: string, props: Record<string, any>) => {
    get().updateComponent(componentId, { props });
  },

  /**
   * Move a component to a new position
   */
  moveComponent: (componentId: string, newPosition: ComponentInstance['position']) => {
    get().updateComponent(componentId, { position: newPosition });
  },

  /**
   * Resize a component
   */
  resizeComponent: (componentId: string, newSize: ComponentInstance['size']) => {
    get().updateComponent(componentId, { size: newSize });
  },

  /**
   * Undo last change
   */
  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        currentPage: history[newIndex].pageDefinition
      });
    }
  },

  /**
   * Redo last undone change
   */
  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        currentPage: history[newIndex].pageDefinition
      });
    }
  },

  /**
   * Check if undo is available
   */
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  /**
   * Check if redo is available
   */
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  /**
   * Set view mode (edit or preview)
   */
  setViewMode: (mode: ViewMode) => {
    set({ viewMode: mode });
  },

  /**
   * Save current state to history
   */
  saveSnapshot: (description?: string) => {
    const { currentPage, history, historyIndex } = get();
    if (!currentPage) return;

    // Remove any history after current index (for redo)
    const newHistory = history.slice(0, historyIndex + 1);

    // Add new entry
    newHistory.push({
      pageDefinition: currentPage,
      timestamp: Date.now(),
      description
    });

    // Limit history to 50 entries
    const limitedHistory = newHistory.length > 50
      ? newHistory.slice(newHistory.length - 50)
      : newHistory;

    set({
      history: limitedHistory,
      historyIndex: limitedHistory.length - 1
    });
  },

  /**
   * Update grid configuration
   */
  setGridConfig: (config: Partial<GridConfig>) => {
    const { gridConfig, currentPage } = get();
    const updatedGridConfig = { ...gridConfig, ...config };

    if (currentPage) {
      const updatedPage: PageDefinition = {
        ...currentPage,
        grid: updatedGridConfig
      };
      set({ currentPage: updatedPage, gridConfig: updatedGridConfig });
      get().saveSnapshot('Updated grid configuration');
    } else {
      set({ gridConfig: updatedGridConfig });
    }
  },

  /**
   * Clear the current page
   */
  clearPage: () => {
    set({
      currentPage: null,
      selectedComponentId: null,
      history: [],
      historyIndex: -1
    });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  /**
   * Set error state
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Duplicate a component
   */
  duplicateComponent: (componentId: string) => {
    const { currentPage } = get();
    if (!currentPage) return;

    const componentToDuplicate = currentPage.components.find(c => c.instanceId === componentId);
    if (!componentToDuplicate) return;

    // Create duplicate with new instance ID
    const duplicate: ComponentInstance = {
      ...componentToDuplicate,
      instanceId: `${componentToDuplicate.componentId}-${Date.now()}`,
      position: {
        ...componentToDuplicate.position,
        row: componentToDuplicate.position.row + componentToDuplicate.position.rowSpan
      }
    };

    get().addComponent(duplicate);
  },

  /**
   * Find a component by ID (searches recursively through children)
   */
  findComponent: (componentId: string): ComponentInstance | null => {
    const { currentPage } = get();
    if (!currentPage) return null;

    const findInComponents = (components: ComponentInstance[]): ComponentInstance | null => {
      for (const component of components) {
        if (component.instanceId === componentId) {
          return component;
        }
        if (component.children && component.children.length > 0) {
          const found = findInComponents(component.children);
          if (found) return found;
        }
      }
      return null;
    };

    return findInComponents(currentPage.components);
  },

  /**
   * Reparent a component (move it from one container to another)
   * @param componentId - The component to move
   * @param newParentId - The new parent container ID (null for root level)
   * @param insertIndex - Optional index to insert at (default: append to end)
   */
  reparentComponent: (componentId: string, newParentId: string | null, insertIndex?: number) => {
    const { currentPage, findComponent } = get();
    if (!currentPage) return;

    // Find the component to reparent
    const component = findComponent(componentId);
    if (!component) return;

    // Can't reparent to itself
    if (componentId === newParentId) return;

    // Can't reparent to one of its own children (would create circular reference)
    const isDescendant = (parentComp: ComponentInstance, targetId: string): boolean => {
      if (parentComp.instanceId === targetId) return true;
      if (parentComp.children) {
        for (const child of parentComp.children) {
          if (isDescendant(child, targetId)) return true;
        }
      }
      return false;
    };

    if (newParentId && isDescendant(component, newParentId)) {
      console.warn('Cannot reparent component to its own descendant');
      return;
    }

    // Step 1: Remove component from its current parent (recursively search all levels)
    const removeFromParent = (components: ComponentInstance[]): ComponentInstance[] => {
      return components
        .filter(comp => comp.instanceId !== componentId) // Remove at this level
        .map(comp => {
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: removeFromParent(comp.children) // Recursively remove from nested children
            };
          }
          return comp;
        });
    };

    // Step 2: Add component to new parent (at specific index if provided)
    const addToNewParent = (components: ComponentInstance[]): ComponentInstance[] => {
      if (!newParentId) {
        // Moving to root level
        const rootComponents = components.filter(c => c.instanceId !== componentId);
        const movedComponent = { ...component, parentId: null };

        // Insert at specific index if provided
        if (insertIndex !== undefined && insertIndex >= 0) {
          const newComponents = [...rootComponents];
          newComponents.splice(Math.min(insertIndex, newComponents.length), 0, movedComponent);
          return newComponents;
        }

        return [...rootComponents, movedComponent];
      } else {
        // Moving to a specific parent container
        return components.map(comp => {
          if (comp.instanceId === newParentId) {
            const movedComponent = { ...component, parentId: newParentId };
            const currentChildren = comp.children || [];

            // Insert at specific index if provided
            if (insertIndex !== undefined && insertIndex >= 0) {
              const newChildren = [...currentChildren];
              newChildren.splice(Math.min(insertIndex, newChildren.length), 0, movedComponent);
              return {
                ...comp,
                children: newChildren
              };
            }

            // Otherwise append to end
            return {
              ...comp,
              children: [...currentChildren, movedComponent]
            };
          }
          if (comp.children && comp.children.length > 0) {
            return {
              ...comp,
              children: addToNewParent(comp.children)
            };
          }
          return comp;
        });
      }
    };

    // First remove from old parent
    let updatedComponents = removeFromParent(currentPage.components);

    // If component was at root level, remove it from root
    updatedComponents = updatedComponents.filter(c => c.instanceId !== componentId);

    // Then add to new parent
    updatedComponents = addToNewParent(updatedComponents);

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: updatedComponents
    };

    set({ currentPage: updatedPage });
    get().saveSnapshot(`Reparented component ${componentId}`);
  },

  /**
   * Reorder a component within its parent (move up, down, to top, or to bottom)
   * @param componentId - The component to reorder
   * @param direction - 'up', 'down', 'top', or 'bottom'
   */
  reorderComponent: (componentId: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    const { currentPage, findComponent } = get();
    if (!currentPage) return;

    const component = findComponent(componentId);
    if (!component) return;

    const parentId = component.parentId;

    // Helper to reorder within an array
    const reorderInArray = (components: ComponentInstance[]): ComponentInstance[] => {
      const index = components.findIndex(c => c.instanceId === componentId);
      if (index === -1) return components;

      const newComponents = [...components];
      const [removed] = newComponents.splice(index, 1);

      let newIndex: number;
      switch (direction) {
        case 'up':
          newIndex = Math.max(0, index - 1);
          break;
        case 'down':
          newIndex = Math.min(newComponents.length, index + 1);
          break;
        case 'top':
          newIndex = 0;
          break;
        case 'bottom':
          newIndex = newComponents.length;
          break;
        default:
          newIndex = index;
      }

      newComponents.splice(newIndex, 0, removed);
      return newComponents;
    };

    // Recursively find and reorder in the correct parent
    const reorderRecursive = (components: ComponentInstance[]): ComponentInstance[] => {
      if (!parentId) {
        // Component is at root level
        return reorderInArray(components);
      }

      return components.map(comp => {
        if (comp.instanceId === parentId) {
          // Found the parent, reorder within its children
          return {
            ...comp,
            children: reorderInArray(comp.children || [])
          };
        }
        if (comp.children && comp.children.length > 0) {
          return {
            ...comp,
            children: reorderRecursive(comp.children)
          };
        }
        return comp;
      });
    };

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: reorderRecursive(currentPage.components)
    };

    set({ currentPage: updatedPage });
    get().saveSnapshot(`Reordered component ${componentId} ${direction}`);
  },

  /**
   * Move a component to a specific index within its parent
   * @param componentId - The component to move
   * @param newIndex - The target index
   */
  moveComponentToIndex: (componentId: string, newIndex: number) => {
    const { currentPage, findComponent } = get();
    if (!currentPage) return;

    const component = findComponent(componentId);
    if (!component) return;

    const parentId = component.parentId;

    // Helper to move to specific index within an array
    const moveToIndex = (components: ComponentInstance[]): ComponentInstance[] => {
      const currentIndex = components.findIndex(c => c.instanceId === componentId);
      if (currentIndex === -1) return components;

      const newComponents = [...components];
      const [removed] = newComponents.splice(currentIndex, 1);
      const targetIndex = Math.max(0, Math.min(newComponents.length, newIndex));
      newComponents.splice(targetIndex, 0, removed);
      return newComponents;
    };

    // Recursively find and reorder in the correct parent
    const moveRecursive = (components: ComponentInstance[]): ComponentInstance[] => {
      if (!parentId) {
        // Component is at root level
        return moveToIndex(components);
      }

      return components.map(comp => {
        if (comp.instanceId === parentId) {
          // Found the parent, move within its children
          return {
            ...comp,
            children: moveToIndex(comp.children || [])
          };
        }
        if (comp.children && comp.children.length > 0) {
          return {
            ...comp,
            children: moveRecursive(comp.children)
          };
        }
        return comp;
      });
    };

    const updatedPage: PageDefinition = {
      ...currentPage,
      components: moveRecursive(currentPage.components)
    };

    set({ currentPage: updatedPage });
    get().saveSnapshot(`Moved component ${componentId} to index ${newIndex}`);
  }
}));
