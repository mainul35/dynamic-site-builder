import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Site, Page } from '../types/site';
import { siteService } from '../services/siteService';
import { pageService } from '../services/pageService';

/**
 * Page Tree Node for hierarchical page display
 */
export interface PageTreeNode {
  page: Page;
  children: PageTreeNode[];
  expanded: boolean;
  depth: number;
}

/**
 * Page reorder update for batch reordering
 */
export interface PageReorderUpdate {
  pageId: number;
  parentPageId: number | null;
  displayOrder: number;
}

/**
 * Site Manager Store
 *
 * Manages multi-site state, site selection, and page hierarchy.
 * Used by the Site menu in the menubar.
 */
export interface SiteManagerState {
  // Sites
  sites: Site[];
  currentSiteId: number | null;
  currentSite: Site | null;

  // Pages
  pages: Page[];
  pageTree: PageTreeNode[];
  expandedPageIds: Set<number>;

  // Loading states
  isLoadingSites: boolean;
  isLoadingPages: boolean;
  error: string | null;

  // Actions - Sites
  loadSites: () => Promise<void>;
  selectSite: (siteId: number) => Promise<void>;
  clearCurrentSite: () => void;
  createSite: (siteData: Partial<Site>) => Promise<Site | null>;
  updateSite: (siteId: number, siteData: Partial<Site>) => Promise<Site | null>;
  deleteSite: (siteId: number) => Promise<boolean>;

  // Actions - Pages
  loadSitePages: (siteId: number) => Promise<void>;
  buildPageTree: () => void;
  togglePageExpanded: (pageId: number) => void;
  setPageExpanded: (pageId: number, expanded: boolean) => void;
  expandAllPages: () => void;
  collapseAllPages: () => void;

  // Actions - Page operations
  createPage: (pageData: Partial<Page>) => Promise<Page | null>;
  updatePage: (pageId: number, pageData: Partial<Page>) => Promise<Page | null>;
  deletePage: (pageId: number) => Promise<boolean>;
  reorderPages: (updates: PageReorderUpdate[]) => Promise<boolean>;
  reparentPage: (pageId: number, newParentId: number | null, displayOrder?: number) => Promise<boolean>;
  duplicatePage: (pageId: number) => Promise<Page | null>;

  // Error handling
  clearError: () => void;
}

/**
 * Build a tree structure from flat page array
 */
function buildTreeFromPages(pages: Page[], expandedIds: Set<number> | number[]): PageTreeNode[] {
  // Handle null/undefined/non-array pages
  if (!pages || !Array.isArray(pages)) {
    return [];
  }

  // Ensure expandedIds is a Set (might be an array after rehydration)
  const expandedSet = expandedIds instanceof Set
    ? expandedIds
    : new Set(Array.isArray(expandedIds) ? expandedIds : []);

  const pageMap = new Map<number, PageTreeNode>();
  const rootNodes: PageTreeNode[] = [];

  // First pass: create nodes for all pages
  pages.forEach((page) => {
    pageMap.set(page.id, {
      page,
      children: [],
      expanded: expandedSet.has(page.id),
      depth: 0,
    });
  });

  // Second pass: build parent-child relationships
  pages.forEach((page) => {
    const node = pageMap.get(page.id)!;
    if (page.parentPageId && pageMap.has(page.parentPageId)) {
      const parentNode = pageMap.get(page.parentPageId)!;
      parentNode.children.push(node);
      node.depth = parentNode.depth + 1;
    } else {
      rootNodes.push(node);
    }
  });

  // Sort children by displayOrder
  const sortChildren = (nodes: PageTreeNode[]): PageTreeNode[] => {
    return nodes
      .sort((a, b) => a.page.displayOrder - b.page.displayOrder)
      .map((node) => ({
        ...node,
        children: sortChildren(node.children),
      }));
  };

  return sortChildren(rootNodes);
}

/**
 * Calculate depth for all nodes (recursive)
 */
function calculateDepths(nodes: PageTreeNode[], depth: number = 0): PageTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    depth,
    children: calculateDepths(node.children, depth + 1),
  }));
}

export const useSiteManagerStore = create<SiteManagerState>()(
  persist(
    (set, get) => ({
      // Initial state
      sites: [],
      currentSiteId: null,
      currentSite: null,
      pages: [],
      pageTree: [],
      expandedPageIds: new Set<number>(),
      isLoadingSites: false,
      isLoadingPages: false,
      error: null,

      // Load all sites for the current user
      loadSites: async () => {
        console.log('[siteManagerStore] loadSites called');
        set({ isLoadingSites: true, error: null });
        try {
          const sites = await siteService.getAllSites();
          console.log('[siteManagerStore] Loaded sites:', sites);
          set({ sites, isLoadingSites: false });
        } catch (error) {
          console.error('[siteManagerStore] Failed to load sites:', error);
          set({
            error: 'Failed to load sites',
            isLoadingSites: false,
          });
        }
      },

      // Select a site and load its pages
      selectSite: async (siteId: number) => {
        console.log('[siteManagerStore] selectSite called with siteId:', siteId);
        let { sites, loadSitePages, isLoadingSites } = get();

        // Wait for sites to load if currently loading
        if (isLoadingSites) {
          console.log('[siteManagerStore] Waiting for sites to finish loading...');
          // Poll until sites are loaded (max 5 seconds)
          for (let i = 0; i < 50; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            const state = get();
            if (!state.isLoadingSites) {
              sites = state.sites;
              break;
            }
          }
        }

        console.log('[siteManagerStore] Available sites:', sites.map(s => ({ id: s.id, name: s.siteName })));
        const site = sites.find((s) => s.id === siteId);

        if (!site) {
          console.log('[siteManagerStore] Site not found in local list, fetching from server...');
          // Try to fetch the site
          try {
            const fetchedSite = await siteService.getSiteById(siteId);
            console.log('[siteManagerStore] Fetched site from server:', fetchedSite);
            if (fetchedSite) {
              set({
                currentSiteId: siteId,
                currentSite: fetchedSite,
                sites: [...get().sites, fetchedSite],
              });
              await loadSitePages(siteId);
            }
          } catch (error: any) {
            console.error('[siteManagerStore] Failed to fetch site:', error);
            // If site doesn't exist, clear the selection
            if (error.response?.status === 404) {
              console.log('[siteManagerStore] Site not found, clearing selection');
              set({ currentSiteId: null, currentSite: null, error: 'Site not found' });
            } else {
              set({ error: 'Failed to load site' });
            }
          }
        } else {
          console.log('[siteManagerStore] Site found locally:', site.siteName);
          set({ currentSiteId: siteId, currentSite: site });
          await loadSitePages(siteId);
        }
      },

      // Clear current site selection
      clearCurrentSite: () => {
        set({
          currentSiteId: null,
          currentSite: null,
          pages: [],
          pageTree: [],
        });
      },

      // Create a new site
      createSite: async (siteData: Partial<Site>) => {
        try {
          const newSite = await siteService.createSite(siteData as Omit<Site, 'id'>);
          if (newSite) {
            set((state) => ({ sites: [...state.sites, newSite] }));
            return newSite;
          }
          return null;
        } catch (error) {
          console.error('Failed to create site:', error);
          set({ error: 'Failed to create site' });
          return null;
        }
      },

      // Update a site
      updateSite: async (siteId: number, siteData: Partial<Site>) => {
        try {
          const updatedSite = await siteService.updateSite(siteId, siteData);
          if (updatedSite) {
            set((state) => ({
              sites: state.sites.map((s) => (s.id === siteId ? updatedSite : s)),
              currentSite: state.currentSiteId === siteId ? updatedSite : state.currentSite,
            }));
            return updatedSite;
          }
          return null;
        } catch (error) {
          console.error('Failed to update site:', error);
          set({ error: 'Failed to update site' });
          return null;
        }
      },

      // Delete a site
      deleteSite: async (siteId: number) => {
        try {
          await siteService.deleteSite(siteId);
          set((state) => ({
            sites: state.sites.filter((s) => s.id !== siteId),
            currentSiteId: state.currentSiteId === siteId ? null : state.currentSiteId,
            currentSite: state.currentSiteId === siteId ? null : state.currentSite,
            pages: state.currentSiteId === siteId ? [] : state.pages,
            pageTree: state.currentSiteId === siteId ? [] : state.pageTree,
          }));
          return true;
        } catch (error) {
          console.error('Failed to delete site:', error);
          set({ error: 'Failed to delete site' });
          return false;
        }
      },

      // Load pages for a site
      loadSitePages: async (siteId: number) => {
        console.log('[siteManagerStore] loadSitePages called for siteId:', siteId);
        set({ isLoadingPages: true, error: null });
        try {
          const response = await pageService.getAllPages(siteId);
          console.log('[siteManagerStore] API response for pages:', response);
          // Ensure pages is always an array
          const pages = Array.isArray(response) ? response : [];
          console.log('[siteManagerStore] Setting pages:', pages);
          set({ pages, isLoadingPages: false });
          get().buildPageTree();
        } catch (error: any) {
          console.error('Failed to load pages:', error);
          // Extract more detailed error message
          let errorMessage = 'Failed to load pages';
          if (error.response) {
            // Server responded with error status
            const status = error.response.status;
            const data = error.response.data;
            if (status === 403) {
              errorMessage = 'Access denied to this site';
            } else if (status === 404) {
              errorMessage = 'Site not found';
            } else if (data?.error) {
              errorMessage = data.error;
            } else {
              errorMessage = `Failed to load pages (${status})`;
            }
            console.error('[siteManagerStore] API error:', status, data);
          } else if (error.message) {
            errorMessage = error.message;
          }
          set({
            error: errorMessage,
            isLoadingPages: false,
            pages: [],
            pageTree: [],
          });
        }
      },

      // Build page tree from flat pages array
      buildPageTree: () => {
        const { pages, expandedPageIds } = get();
        // Ensure expandedPageIds is a Set (might be an array after rehydration)
        const expandedSet = expandedPageIds instanceof Set
          ? expandedPageIds
          : new Set(Array.isArray(expandedPageIds) ? expandedPageIds : []);
        // Update state if we had to convert
        if (!(expandedPageIds instanceof Set)) {
          set({ expandedPageIds: expandedSet });
        }
        const tree = buildTreeFromPages(pages, expandedSet);
        const treeWithDepths = calculateDepths(tree);
        set({ pageTree: treeWithDepths });
      },

      // Toggle page expanded state in tree
      togglePageExpanded: (pageId: number) => {
        set((state) => {
          // Ensure we have a proper Set
          const currentSet = state.expandedPageIds instanceof Set
            ? state.expandedPageIds
            : new Set(Array.isArray(state.expandedPageIds) ? state.expandedPageIds : []);
          const newExpandedIds = new Set(currentSet);
          if (newExpandedIds.has(pageId)) {
            newExpandedIds.delete(pageId);
          } else {
            newExpandedIds.add(pageId);
          }
          return { expandedPageIds: newExpandedIds };
        });
        get().buildPageTree();
      },

      // Set page expanded state
      setPageExpanded: (pageId: number, expanded: boolean) => {
        set((state) => {
          // Ensure we have a proper Set
          const currentSet = state.expandedPageIds instanceof Set
            ? state.expandedPageIds
            : new Set(Array.isArray(state.expandedPageIds) ? state.expandedPageIds : []);
          const newExpandedIds = new Set(currentSet);
          if (expanded) {
            newExpandedIds.add(pageId);
          } else {
            newExpandedIds.delete(pageId);
          }
          return { expandedPageIds: newExpandedIds };
        });
        get().buildPageTree();
      },

      // Expand all pages
      expandAllPages: () => {
        const { pages } = get();
        const allIds = new Set(pages.map((p) => p.id));
        set({ expandedPageIds: allIds });
        get().buildPageTree();
      },

      // Collapse all pages
      collapseAllPages: () => {
        set({ expandedPageIds: new Set() });
        get().buildPageTree();
      },

      // Create a new page
      createPage: async (pageData: Partial<Page>) => {
        const { currentSiteId, loadSitePages } = get();
        console.log('[siteManagerStore] createPage called with:', pageData, 'currentSiteId:', currentSiteId);
        if (!currentSiteId) {
          console.error('[siteManagerStore] No site selected!');
          set({ error: 'No site selected' });
          return null;
        }

        try {
          const newPage = await pageService.createPage(currentSiteId, pageData);
          console.log('[siteManagerStore] Created page response:', newPage);
          if (newPage) {
            console.log('[siteManagerStore] Reloading pages...');
            await loadSitePages(currentSiteId);
            return newPage;
          }
          return null;
        } catch (error) {
          console.error('Failed to create page:', error);
          set({ error: 'Failed to create page' });
          return null;
        }
      },

      // Update a page
      updatePage: async (pageId: number, pageData: Partial<Page>) => {
        const { currentSiteId, loadSitePages } = get();
        if (!currentSiteId) return null;

        try {
          const updatedPage = await pageService.updatePage(currentSiteId, pageId, pageData);
          if (updatedPage) {
            await loadSitePages(currentSiteId);
            return updatedPage;
          }
          return null;
        } catch (error) {
          console.error('Failed to update page:', error);
          set({ error: 'Failed to update page' });
          return null;
        }
      },

      // Delete a page
      deletePage: async (pageId: number) => {
        const { currentSiteId, loadSitePages } = get();
        if (!currentSiteId) return false;

        try {
          await pageService.deletePage(currentSiteId, pageId);
          await loadSitePages(currentSiteId);
          return true;
        } catch (error) {
          console.error('Failed to delete page:', error);
          set({ error: 'Failed to delete page' });
          return false;
        }
      },

      // Reorder pages (batch update)
      reorderPages: async (updates: PageReorderUpdate[]) => {
        const { currentSiteId, loadSitePages } = get();
        if (!currentSiteId) return false;

        try {
          await pageService.reorderPages(currentSiteId, updates);
          await loadSitePages(currentSiteId);
          return true;
        } catch (error) {
          console.error('Failed to reorder pages:', error);
          set({ error: 'Failed to reorder pages' });
          return false;
        }
      },

      // Reparent a page (change its parent)
      reparentPage: async (pageId: number, newParentId: number | null, displayOrder?: number) => {
        const { currentSiteId, pages, loadSitePages } = get();
        if (!currentSiteId) return false;

        // Calculate display order if not provided
        let order = displayOrder;
        if (order === undefined) {
          const siblings = pages.filter((p) =>
            newParentId === null ? !p.parentPageId : p.parentPageId === newParentId
          );
          order = siblings.length;
        }

        try {
          await pageService.updatePage(currentSiteId, pageId, {
            parentPageId: newParentId,
            displayOrder: order,
          });
          await loadSitePages(currentSiteId);
          return true;
        } catch (error) {
          console.error('Failed to reparent page:', error);
          set({ error: 'Failed to move page' });
          return false;
        }
      },

      // Duplicate a page
      duplicatePage: async (pageId: number) => {
        const { currentSiteId, pages, loadSitePages } = get();
        if (!currentSiteId) return null;

        const sourcePage = pages.find((p) => p.id === pageId);
        if (!sourcePage) return null;

        try {
          // Get the page definition to copy
          const pageDefinition = await pageService.getPageDefinition(currentSiteId, pageId);

          // Create new page with copied data
          const newPage = await pageService.createPage(currentSiteId, {
            pageName: `${sourcePage.pageName} (Copy)`,
            pageSlug: `${sourcePage.pageSlug}-copy-${Date.now()}`,
            pageType: sourcePage.pageType,
            title: sourcePage.title,
            description: sourcePage.description,
            parentPageId: sourcePage.parentPageId,
            displayOrder: sourcePage.displayOrder + 1,
          });

          if (newPage && pageDefinition) {
            // Save the page definition to the new page
            await pageService.savePageVersion(currentSiteId, newPage.id, {
              pageDefinition,
              changeDescription: 'Duplicated from page ' + sourcePage.pageName,
            });
          }

          await loadSitePages(currentSiteId);
          return newPage;
        } catch (error) {
          console.error('Failed to duplicate page:', error);
          set({ error: 'Failed to duplicate page' });
          return null;
        }
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'site-manager-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSiteId: state.currentSiteId,
        expandedPageIds: Array.from(state.expandedPageIds),
      }),
      onRehydrate: () => (state) => {
        // Convert expandedPageIds back to Set after rehydration
        if (state && Array.isArray(state.expandedPageIds)) {
          state.expandedPageIds = new Set(state.expandedPageIds as unknown as number[]);
        }

        // Schedule initialization after rehydration completes
        // This loads sites from backend and restores the selected site
        setTimeout(() => {
          const store = useSiteManagerStore.getState();
          const persistedSiteId = state?.currentSiteId;

          console.log('[siteManagerStore] Rehydrated, persisted currentSiteId:', persistedSiteId);

          // Load sites from backend
          store.loadSites().then(() => {
            // After sites are loaded, restore the selected site if we had one
            if (persistedSiteId) {
              console.log('[siteManagerStore] Restoring selected site:', persistedSiteId);
              store.selectSite(persistedSiteId);
            }
          }).catch((err) => {
            console.error('[siteManagerStore] Failed to load sites on init:', err);
          });
        }, 0);
      },
    }
  )
);

// Selector hooks
export const useCurrentSite = () => useSiteManagerStore((state) => state.currentSite);
export const useSites = () => useSiteManagerStore((state) => state.sites);
export const usePageTree = () => useSiteManagerStore((state) => state.pageTree);
export const useIsLoadingSites = () => useSiteManagerStore((state) => state.isLoadingSites);
export const useIsLoadingPages = () => useSiteManagerStore((state) => state.isLoadingPages);

export default useSiteManagerStore;
