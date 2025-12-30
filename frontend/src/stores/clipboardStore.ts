import { create } from 'zustand';
import { ComponentInstance, PageDefinition } from '../types/builder';

/**
 * Clipboard item types
 */
export type ClipboardItemType = 'component' | 'components' | 'page';

/**
 * Clipboard item structure
 */
export interface ClipboardItem {
  type: ClipboardItemType;
  data: ComponentInstance | ComponentInstance[] | PageDefinition;
  sourcePageId?: number;
  sourceSiteId?: number;
  timestamp: number;
  isCut: boolean;
}

/**
 * Generate a unique ID for pasted components
 */
function generateUniqueId(componentId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 11);
  return `${componentId}-${timestamp}-${random}`;
}

/**
 * Deep clone a component with new unique IDs
 */
function cloneComponent(component: ComponentInstance): ComponentInstance {
  return {
    ...component,
    instanceId: generateUniqueId(component.componentId),
    children: component.children?.map(cloneComponent),
  };
}

/**
 * Deep clone multiple components
 */
function cloneComponents(components: ComponentInstance[]): ComponentInstance[] {
  return components.map(cloneComponent);
}

/**
 * Find a component by ID in a tree structure
 */
function findComponentById(
  components: ComponentInstance[],
  instanceId: string
): ComponentInstance | null {
  for (const component of components) {
    if (component.instanceId === instanceId) {
      return component;
    }
    if (component.children) {
      const found = findComponentById(component.children, instanceId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find multiple components by IDs
 */
function findComponentsByIds(
  components: ComponentInstance[],
  instanceIds: string[]
): ComponentInstance[] {
  return instanceIds
    .map((id) => findComponentById(components, id))
    .filter((c): c is ComponentInstance => c !== null);
}

/**
 * Remove component from tree by ID (returns modified tree)
 */
function removeComponentFromTree(
  components: ComponentInstance[],
  instanceId: string
): ComponentInstance[] {
  return components
    .filter((c) => c.instanceId !== instanceId)
    .map((c) => ({
      ...c,
      children: c.children ? removeComponentFromTree(c.children, instanceId) : undefined,
    }));
}

/**
 * Clipboard Store
 *
 * Manages cut/copy/paste operations for components and pages.
 * Supports single component, multiple components, and full page copying.
 */
export interface ClipboardState {
  // Current clipboard content
  clipboard: ClipboardItem | null;

  // Cut source tracking (for visual feedback)
  cutSourceIds: string[];

  // Actions
  copy: (
    components: ComponentInstance[],
    selectedIds: string[],
    pageId?: number,
    siteId?: number
  ) => void;
  cut: (
    components: ComponentInstance[],
    selectedIds: string[],
    pageId?: number,
    siteId?: number
  ) => void;
  copyPage: (pageDefinition: PageDefinition, pageId: number, siteId?: number) => void;
  paste: () => ComponentInstance[] | null;
  pastePage: () => PageDefinition | null;
  clear: () => void;

  // Queries
  canPaste: () => boolean;
  canPasteAsComponent: () => boolean;
  canPasteAsPage: () => boolean;
  getClipboardInfo: () => { type: ClipboardItemType; count: number } | null;
  isCutSource: (instanceId: string) => boolean;

  // For cut operation: get IDs to remove from source
  getAndClearCutSourceIds: () => string[];
}

export const useClipboardStore = create<ClipboardState>()((set, get) => ({
  // Initial state
  clipboard: null,
  cutSourceIds: [],

  // Copy selected components
  copy: (components, selectedIds, pageId, siteId) => {
    if (selectedIds.length === 0) return;

    const selectedComponents = findComponentsByIds(components, selectedIds);
    if (selectedComponents.length === 0) return;

    const clonedComponents = cloneComponents(selectedComponents);

    set({
      clipboard: {
        type: selectedComponents.length === 1 ? 'component' : 'components',
        data: selectedComponents.length === 1 ? clonedComponents[0] : clonedComponents,
        sourcePageId: pageId,
        sourceSiteId: siteId,
        timestamp: Date.now(),
        isCut: false,
      },
      cutSourceIds: [],
    });
  },

  // Cut selected components (mark for removal after paste)
  cut: (components, selectedIds, pageId, siteId) => {
    if (selectedIds.length === 0) return;

    const selectedComponents = findComponentsByIds(components, selectedIds);
    if (selectedComponents.length === 0) return;

    // Store original components (not cloned) for cut
    set({
      clipboard: {
        type: selectedComponents.length === 1 ? 'component' : 'components',
        data: selectedComponents.length === 1 ? selectedComponents[0] : selectedComponents,
        sourcePageId: pageId,
        sourceSiteId: siteId,
        timestamp: Date.now(),
        isCut: true,
      },
      cutSourceIds: selectedIds,
    });
  },

  // Copy entire page definition
  copyPage: (pageDefinition, pageId, siteId) => {
    set({
      clipboard: {
        type: 'page',
        data: JSON.parse(JSON.stringify(pageDefinition)), // Deep clone
        sourcePageId: pageId,
        sourceSiteId: siteId,
        timestamp: Date.now(),
        isCut: false,
      },
      cutSourceIds: [],
    });
  },

  // Paste components (returns cloned components with new IDs)
  paste: () => {
    const { clipboard } = get();
    if (!clipboard) return null;

    if (clipboard.type === 'page') {
      // For page paste, extract root components
      const pageData = clipboard.data as PageDefinition;
      if (pageData.rootComponent) {
        return [cloneComponent(pageData.rootComponent)];
      }
      return null;
    }

    // For component paste
    if (clipboard.type === 'component') {
      const component = clipboard.data as ComponentInstance;
      return [cloneComponent(component)];
    }

    if (clipboard.type === 'components') {
      const components = clipboard.data as ComponentInstance[];
      return cloneComponents(components);
    }

    return null;
  },

  // Paste as full page definition
  pastePage: () => {
    const { clipboard } = get();
    if (!clipboard || clipboard.type !== 'page') return null;

    const pageData = clipboard.data as PageDefinition;

    // Deep clone with new IDs for all components
    const clonedPage: PageDefinition = {
      ...pageData,
      rootComponent: pageData.rootComponent
        ? cloneComponent(pageData.rootComponent)
        : undefined,
    };

    return clonedPage;
  },

  // Clear clipboard
  clear: () => {
    set({
      clipboard: null,
      cutSourceIds: [],
    });
  },

  // Check if paste is possible
  canPaste: () => {
    return get().clipboard !== null;
  },

  // Check if can paste as component(s)
  canPasteAsComponent: () => {
    const { clipboard } = get();
    return clipboard !== null && (clipboard.type === 'component' || clipboard.type === 'components');
  },

  // Check if can paste as page
  canPasteAsPage: () => {
    const { clipboard } = get();
    return clipboard !== null && clipboard.type === 'page';
  },

  // Get clipboard info for UI
  getClipboardInfo: () => {
    const { clipboard } = get();
    if (!clipboard) return null;

    let count = 1;
    if (clipboard.type === 'components') {
      count = (clipboard.data as ComponentInstance[]).length;
    }

    return {
      type: clipboard.type,
      count,
    };
  },

  // Check if component is marked for cut
  isCutSource: (instanceId: string) => {
    return get().cutSourceIds.includes(instanceId);
  },

  // Get and clear cut source IDs (called after paste to remove cut items)
  getAndClearCutSourceIds: () => {
    const { cutSourceIds, clipboard } = get();

    if (clipboard?.isCut && cutSourceIds.length > 0) {
      const ids = [...cutSourceIds];
      set({ cutSourceIds: [], clipboard: null });
      return ids;
    }

    return [];
  },
}));

// Selector hooks
export const useClipboard = () => useClipboardStore((state) => state.clipboard);
export const useCanPaste = () => useClipboardStore((state) => state.canPaste());
export const useCutSourceIds = () => useClipboardStore((state) => state.cutSourceIds);

export default useClipboardStore;
