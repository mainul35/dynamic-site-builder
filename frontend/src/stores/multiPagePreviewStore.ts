import { create } from 'zustand';
import { Page } from '../types/site';
import { PageDefinition } from '../types/builder';

/**
 * Multi-page preview state for navigating between pages in preview mode
 */
interface MultiPagePreviewState {
  // Whether multi-page preview is active
  isActive: boolean;

  // All available pages in the site
  pages: Page[];

  // Loaded page definitions (cached)
  loadedPages: Map<string, PageDefinition>;

  // Current page being previewed (by slug or route path)
  currentPreviewPath: string;

  // Navigation history for back/forward
  history: string[];
  historyIndex: number;

  // Actions
  setActive: (active: boolean) => void;
  setPages: (pages: Page[]) => void;
  navigateToPage: (path: string) => void;
  loadPageDefinition: (path: string, definition: PageDefinition) => void;
  getPageDefinition: (path: string) => PageDefinition | undefined;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  reset: () => void;
}

export const useMultiPagePreviewStore = create<MultiPagePreviewState>((set, get) => ({
  isActive: false,
  pages: [],
  loadedPages: new Map(),
  currentPreviewPath: '/',
  history: ['/'],
  historyIndex: 0,

  setActive: (active: boolean) => {
    set({ isActive: active });
    if (!active) {
      // Reset when exiting preview
      set({
        currentPreviewPath: '/',
        history: ['/'],
        historyIndex: 0,
      });
    }
  },

  setPages: (pages: Page[]) => {
    set({ pages });
  },

  navigateToPage: (path: string) => {
    const { history, historyIndex } = get();

    // Normalize path
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    // Don't navigate to same page
    if (normalizedPath === get().currentPreviewPath) return;

    // Add to history (remove any forward history)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedPath);

    set({
      currentPreviewPath: normalizedPath,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  loadPageDefinition: (path: string, definition: PageDefinition) => {
    const { loadedPages } = get();
    const newLoadedPages = new Map(loadedPages);
    newLoadedPages.set(path, definition);
    set({ loadedPages: newLoadedPages });
  },

  getPageDefinition: (path: string) => {
    return get().loadedPages.get(path);
  },

  goBack: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      set({
        historyIndex: newIndex,
        currentPreviewPath: history[newIndex],
      });
    }
  },

  goForward: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      set({
        historyIndex: newIndex,
        currentPreviewPath: history[newIndex],
      });
    }
  },

  canGoBack: () => {
    return get().historyIndex > 0;
  },

  canGoForward: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  reset: () => {
    set({
      isActive: false,
      pages: [],
      loadedPages: new Map(),
      currentPreviewPath: '/',
      history: ['/'],
      historyIndex: 0,
    });
  },
}));
