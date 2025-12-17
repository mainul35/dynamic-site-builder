import { create } from 'zustand';
import { ComponentRegistryEntry, ComponentManifest } from '../types/builder';

/**
 * Component store interface
 */
interface ComponentState {
  // Component registry cache
  components: ComponentRegistryEntry[];

  // Components grouped by category
  componentsByCategory: Map<string, ComponentRegistryEntry[]>;

  // Loading and error states
  isLoading: boolean;
  error: string | null;

  // Filters
  selectedCategory: string | null;
  searchQuery: string;

  // Cached manifests
  manifestCache: Map<string, ComponentManifest>;

  // Actions
  setComponents: (components: ComponentRegistryEntry[]) => void;
  addComponent: (component: ComponentRegistryEntry) => void;
  removeComponent: (pluginId: string, componentId: string) => void;
  updateComponent: (pluginId: string, componentId: string, updates: Partial<ComponentRegistryEntry>) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  cacheManifest: (key: string, manifest: ComponentManifest) => void;
  getManifest: (pluginId: string, componentId: string) => ComponentManifest | null;
  getFilteredComponents: () => ComponentRegistryEntry[];
  getCategories: () => string[];
  clearCache: () => void;
}

/**
 * Create component store using Zustand
 */
export const useComponentStore = create<ComponentState>((set, get) => ({
  components: [],
  componentsByCategory: new Map(),
  isLoading: false,
  error: null,
  selectedCategory: null,
  searchQuery: '',
  manifestCache: new Map(),

  /**
   * Set all components and rebuild category map
   */
  setComponents: (components: ComponentRegistryEntry[]) => {
    const categoryMap = new Map<string, ComponentRegistryEntry[]>();

    components.forEach(component => {
      const category = component.category || 'Other';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(component);
    });

    set({
      components,
      componentsByCategory: categoryMap,
      isLoading: false,
      error: null
    });
  },

  /**
   * Add a new component to the registry
   */
  addComponent: (component: ComponentRegistryEntry) => {
    const { components, componentsByCategory } = get();

    // Add to components array
    const updatedComponents = [...components, component];

    // Update category map
    const category = component.category || 'Other';
    const updatedCategoryMap = new Map(componentsByCategory);

    if (!updatedCategoryMap.has(category)) {
      updatedCategoryMap.set(category, []);
    }
    updatedCategoryMap.get(category)!.push(component);

    set({
      components: updatedComponents,
      componentsByCategory: updatedCategoryMap
    });
  },

  /**
   * Remove a component from the registry
   */
  removeComponent: (pluginId: string, componentId: string) => {
    const { components, componentsByCategory, manifestCache } = get();

    // Find component to remove
    const componentToRemove = components.find(
      c => c.pluginId === pluginId && c.componentId === componentId
    );

    if (!componentToRemove) return;

    // Remove from components array
    const updatedComponents = components.filter(
      c => !(c.pluginId === pluginId && c.componentId === componentId)
    );

    // Update category map
    const category = componentToRemove.category || 'Other';
    const updatedCategoryMap = new Map(componentsByCategory);

    if (updatedCategoryMap.has(category)) {
      const categoryComponents = updatedCategoryMap.get(category)!.filter(
        c => !(c.pluginId === pluginId && c.componentId === componentId)
      );

      if (categoryComponents.length === 0) {
        updatedCategoryMap.delete(category);
      } else {
        updatedCategoryMap.set(category, categoryComponents);
      }
    }

    // Remove from manifest cache
    const manifestKey = `${pluginId}:${componentId}`;
    const updatedManifestCache = new Map(manifestCache);
    updatedManifestCache.delete(manifestKey);

    set({
      components: updatedComponents,
      componentsByCategory: updatedCategoryMap,
      manifestCache: updatedManifestCache
    });
  },

  /**
   * Update a component in the registry
   */
  updateComponent: (pluginId: string, componentId: string, updates: Partial<ComponentRegistryEntry>) => {
    const { components } = get();

    const updatedComponents = components.map(c =>
      c.pluginId === pluginId && c.componentId === componentId
        ? { ...c, ...updates }
        : c
    );

    get().setComponents(updatedComponents);
  },

  /**
   * Set selected category filter
   */
  setSelectedCategory: (category: string | null) => {
    set({ selectedCategory: category });
  },

  /**
   * Set search query
   */
  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
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
   * Cache a component manifest
   */
  cacheManifest: (key: string, manifest: ComponentManifest) => {
    const { manifestCache } = get();
    const updatedCache = new Map(manifestCache);
    updatedCache.set(key, manifest);
    set({ manifestCache: updatedCache });
  },

  /**
   * Get cached manifest for a component
   */
  getManifest: (pluginId: string, componentId: string): ComponentManifest | null => {
    const { manifestCache } = get();
    const key = `${pluginId}:${componentId}`;
    return manifestCache.get(key) || null;
  },

  /**
   * Get filtered components based on category and search query
   */
  getFilteredComponents: (): ComponentRegistryEntry[] => {
    const { components, selectedCategory, searchQuery } = get();

    let filtered = components;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(c => c.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.componentName.toLowerCase().includes(query) ||
        c.componentId.toLowerCase().includes(query) ||
        (c.category && c.category.toLowerCase().includes(query))
      );
    }

    // Only return active components
    filtered = filtered.filter(c => c.isActive);

    return filtered;
  },

  /**
   * Get all unique categories
   */
  getCategories: (): string[] => {
    const { componentsByCategory } = get();
    return Array.from(componentsByCategory.keys()).sort();
  },

  /**
   * Clear all cached data
   */
  clearCache: () => {
    set({
      components: [],
      componentsByCategory: new Map(),
      manifestCache: new Map(),
      selectedCategory: null,
      searchQuery: '',
      isLoading: false,
      error: null
    });
  }
}));
