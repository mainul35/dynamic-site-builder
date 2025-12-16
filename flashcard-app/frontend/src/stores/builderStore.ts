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
   * Add a new component to the page
   */
  addComponent: (component: ComponentInstance) => {
    const { currentPage } = get();
    if (!currentPage) return;

    let updatedComponents = [...currentPage.components];

    // If component has a parent, add it to parent's children array
    if (component.parentId) {
      updatedComponents = updatedComponents.map(comp => {
        if (comp.instanceId === component.parentId) {
          return {
            ...comp,
            children: [...(comp.children || []), component]
          };
        }
        return comp;
      });
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
  }
}));
