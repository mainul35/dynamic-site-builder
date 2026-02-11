import React, { useEffect, useState } from 'react';
import { useMultiPagePreviewStore } from '../../stores/multiPagePreviewStore';
import { useBuilderStore } from '../../stores/builderStore';
import { useSiteManagerStore } from '../../stores/siteManagerStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { PreviewNavigationInterceptor } from './PreviewNavigationInterceptor';
import { BuilderCanvas } from './BuilderCanvas';
import { BreakpointToggle } from './BreakpointToggle';
import { Page } from '../../types/site';
import { PageDefinition, ComponentInstance } from '../../types/builder';
import { pageService } from '../../services/pageService';
import { loadPlugin } from '../../services/pluginLoaderService';
import './MultiPagePreview.css';

/**
 * Recursively collect all unique plugin IDs from a component tree
 */
function collectPluginIds(components: ComponentInstance[]): Set<string> {
  const pluginIds = new Set<string>();

  function traverse(component: ComponentInstance) {
    if (component.pluginId) {
      pluginIds.add(component.pluginId);
    }
    if (component.children && component.children.length > 0) {
      component.children.forEach(traverse);
    }
  }

  components.forEach(traverse);
  return pluginIds;
}

/**
 * Preload all plugins used by a page definition
 */
async function preloadPluginsForPage(page: PageDefinition): Promise<void> {
  // Debug: Log page structure to check if children are populated
  console.log('[Preview] Page structure:', {
    pageName: page.pageName,
    componentsCount: page.components?.length,
    components: page.components?.map(c => ({
      instanceId: c.instanceId,
      componentId: c.componentId,
      childrenCount: c.children?.length || 0,
      children: c.children?.map(ch => ({
        instanceId: ch.instanceId,
        componentId: ch.componentId,
        childrenCount: ch.children?.length || 0
      }))
    }))
  });

  const pluginIds = collectPluginIds(page.components || []);
  console.log('[Preview] Preloading plugins:', Array.from(pluginIds));

  // Load all plugins in parallel
  await Promise.all(
    Array.from(pluginIds).map(pluginId =>
      loadPlugin(pluginId).catch(err => {
        console.warn(`[Preview] Failed to preload plugin ${pluginId}:`, err);
      })
    )
  );

  console.log('[Preview] All plugins preloaded');
}

interface MultiPagePreviewProps {
  siteId: number | null;
  initialPages?: Page[];
  currentEditingPage?: Page | null;
  onExitPreview: () => void;
}

/**
 * MultiPagePreview - Full site preview with navigation between pages
 */
export const MultiPagePreview: React.FC<MultiPagePreviewProps> = ({
  siteId,
  initialPages = [],
  currentEditingPage,
  onExitPreview,
}) => {
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [isLoadingPlugins, setIsLoadingPlugins] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get effective siteId from URL param or store
  const { currentSiteId } = useSiteManagerStore();
  const effectiveSiteId = siteId ?? currentSiteId;

  const {
    isActive,
    pages,
    currentPreviewPath,
    previewPage,
    setActive,
    setPages,
    navigateToPage,
    loadPageDefinition,
    getPageDefinition,
    setPreviewPage,
    setOriginalEditingPage,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useMultiPagePreviewStore();

  const { currentPage } = useBuilderStore();
  const { canvasWidth } = useUIPreferencesStore();

  // Initialize preview mode
  useEffect(() => {
    setActive(true);

    // IMPORTANT: Store the original page being edited so we can restore it when exiting preview
    // This prevents the bug where navigating in preview overwrites the editing page
    if (currentPage && currentEditingPage) {
      setOriginalEditingPage(currentPage, currentEditingPage);
    }

    // Load pages
    if (initialPages.length > 0) {
      setPages(initialPages);

      // Cache all page definitions from localStorage ONLY for demo mode (no site selected)
      // When we have a site selected, page definitions should be loaded from API on demand
      if (!effectiveSiteId) {
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
        initialPages.forEach(page => {
          const pageData = savedPages[page.pageSlug];
          if (pageData) {
            const path = page.routePath || `/${page.pageSlug}`;
            loadPageDefinition(path, pageData);
          }
        });
      }

      // Determine which page to start with
      // Prefer the currently editing page, otherwise use first page
      let startPage = currentEditingPage || initialPages[0];

      if (startPage) {
        // Determine the path - use routePath if set and not empty, otherwise derive from pageSlug
        // Ensure the pageSlug is lowercase for consistent URL handling
        const slug = startPage.pageSlug?.toLowerCase() || 'home';
        // Check for non-empty routePath (null, undefined, or empty string should all fallback)
        const hasValidRoutePath = startPage.routePath && startPage.routePath.trim() !== '';
        const startPath = hasValidRoutePath ? startPage.routePath : (slug === 'home' ? '/' : `/${slug}`);
        console.log(`[Preview] Starting preview from page: "${startPage.pageName}", path="${startPath}", routePath="${startPage.routePath}", pageSlug="${startPage.pageSlug}"`);

        // Cache the current page definition under its correct path
        // This ensures the currently editing page is immediately available
        // IMPORTANT: Only cache if the currentPage matches the currentEditingPage
        // This prevents caching wrong content at wrong paths
        if (currentPage && currentEditingPage) {
          // Verify the page names match to avoid caching wrong content
          const pageNamesMatch = currentPage.pageName?.toLowerCase() === currentEditingPage.pageName?.toLowerCase();
          if (pageNamesMatch) {
            console.log(`[Preview] Caching current editing page "${currentPage.pageName}" at path "${startPath}"`);
            // Debug: Log the currentPage structure to verify children are populated
            console.log(`[Preview] currentPage structure from builderStore:`, {
              pageName: currentPage.pageName,
              componentsCount: currentPage.components?.length,
              components: currentPage.components?.map(c => ({
                instanceId: c.instanceId,
                componentId: c.componentId,
                slot: c.props?.slot,
                childrenCount: c.children?.length || 0,
                children: c.children?.map(ch => ({
                  instanceId: ch.instanceId,
                  componentId: ch.componentId,
                  childrenCount: ch.children?.length || 0
                }))
              }))
            });
            loadPageDefinition(startPath, currentPage);
            // Set initial preview page
            setPreviewPage(currentPage);
          } else {
            console.warn(`[Preview] Page name mismatch! currentPage="${currentPage.pageName}" vs currentEditingPage="${currentEditingPage.pageName}". Not caching.`);
          }
        }

        navigateToPage(startPath);
      }
    } else {
      loadPagesFromStorage();

      // Store current page as the initial page for fallback
      if (currentPage) {
        const initialPath = '/';
        loadPageDefinition(initialPath, currentPage);
        setPreviewPage(currentPage);
      }
    }

    return () => {
      setActive(false);
    };
  }, []);

  // Load pages from localStorage (demo mode)
  const loadPagesFromStorage = () => {
    const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
    const demoPages: Page[] = Object.entries(savedPages).map(([key, val]: [string, any], index) => ({
      id: index + 1,
      siteId: 0,
      pageName: val.pageName || key,
      pageSlug: key,
      pageType: val.pageType || 'standard',
      routePath: key === 'home' ? '/' : `/${key}`,
      displayOrder: index,
      isPublished: false,
      createdAt: val.savedAt || new Date().toISOString(),
      updatedAt: val.savedAt || new Date().toISOString(),
    }));

    // Add home page if none exists
    if (demoPages.length === 0 && currentPage) {
      demoPages.push({
        id: 1,
        siteId: 0,
        pageName: currentPage.pageName || 'Home',
        pageSlug: 'home',
        pageType: 'homepage',
        routePath: '/',
        displayOrder: 0,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setPages(demoPages);

    // Cache all page definitions
    Object.entries(savedPages).forEach(([key, val]: [string, any]) => {
      const path = key === 'home' ? '/' : `/${key}`;
      loadPageDefinition(path, val as PageDefinition);
    });
  };

  // Load page when path changes
  // IMPORTANT: We use setPreviewPage (NOT setCurrentPage from builderStore)
  // This keeps the preview page separate from the editing page
  useEffect(() => {
    if (!isActive) return;

    const loadPage = async () => {
      console.log(`[Preview] loadPage called for path: "${currentPreviewPath}"`);

      // Check if page is already loaded in cache
      const cachedPage = getPageDefinition(currentPreviewPath);
      if (cachedPage) {
        console.log(`[Preview] Found cached page for "${currentPreviewPath}": "${cachedPage.pageName}"`);
        setError(null); // Clear any previous error when loading cached page

        // Preload all plugins before rendering
        setIsLoadingPlugins(true);
        try {
          await preloadPluginsForPage(cachedPage);
        } finally {
          setIsLoadingPlugins(false);
        }

        setPreviewPage(cachedPage);
        return;
      }
      console.log(`[Preview] No cache found for "${currentPreviewPath}", loading from API...`);

      // Find the page metadata
      console.log(`[Preview] Looking for page with path "${currentPreviewPath}" in pages:`,
        pages.map(p => ({ id: p.id, name: p.pageName, routePath: p.routePath, slug: p.pageSlug })));

      const page = pages.find(p => {
        const slug = p.pageSlug?.toLowerCase() || 'home';
        const hasValidRoutePath = p.routePath && p.routePath.trim() !== '';
        const pagePath = hasValidRoutePath ? p.routePath : (slug === 'home' ? '/' : `/${slug}`);
        return pagePath === currentPreviewPath || `/${slug}` === currentPreviewPath;
      });

      if (page) {
        console.log(`[Preview] Found page: id=${page.id}, name="${page.pageName}", routePath="${page.routePath}"`);
      }

      if (!page) {
        // Only check localStorage if no site is selected (demo mode)
        if (!effectiveSiteId) {
          const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
          const slug = currentPreviewPath === '/' ? 'home' : currentPreviewPath.slice(1);
          const localPage = savedPages[slug];

          if (localPage) {
            // Preload plugins before rendering
            setIsLoadingPlugins(true);
            try {
              await preloadPluginsForPage(localPage);
            } finally {
              setIsLoadingPlugins(false);
            }

            loadPageDefinition(currentPreviewPath, localPage);
            setPreviewPage(localPage);
            return;
          }
        }

        setError(`Page not found: ${currentPreviewPath}`);
        return;
      }

      setIsLoadingPage(true);
      setError(null);

      try {
        if (effectiveSiteId) {
          // Load from backend API
          try {
            const definition = await pageService.getPageDefinition(effectiveSiteId, page.id);
            console.log(`[Preview] Loaded page definition for "${page.pageName}" (id: ${page.id}) from API:`, {
              pageName: definition?.pageName,
              componentsCount: definition?.components?.length,
              version: definition?.version
            });

            // Preload all plugins before rendering
            setIsLoadingPlugins(true);
            try {
              await preloadPluginsForPage(definition);
            } finally {
              setIsLoadingPlugins(false);
            }

            loadPageDefinition(currentPreviewPath, definition);
            setPreviewPage(definition);
          } catch (apiErr: any) {
            // Handle 404 - page exists but has no saved content yet
            const status = apiErr?.response?.status;
            console.log(`[Preview] API error for page "${page.pageName}" (id: ${page.id}): status=${status}`, apiErr?.response?.data);

            if (status === 404) {
              // Page exists but has no saved content in database
              // Try localStorage as fallback (for pages designed but not yet saved to DB)
              const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
              const localPageData = savedPages[page.pageSlug];

              console.log(`[Preview] localStorage fallback lookup:`, {
                lookingForSlug: page.pageSlug,
                availableKeys: Object.keys(savedPages),
                foundData: localPageData ? { pageName: localPageData.pageName, componentsCount: localPageData.components?.length } : null
              });

              if (localPageData && localPageData.components && localPageData.components.length > 0) {
                console.log(`[Preview] Found localStorage fallback for "${page.pageName}"`);

                // Preload plugins before rendering
                setIsLoadingPlugins(true);
                try {
                  await preloadPluginsForPage(localPageData);
                } finally {
                  setIsLoadingPlugins(false);
                }

                loadPageDefinition(currentPreviewPath, localPageData);
                setPreviewPage(localPageData);
              } else {
                // Create an empty page definition for preview
                const emptyDefinition: PageDefinition = {
                  version: '1.0',
                  pageId: page.id,
                  pageName: page.pageName,
                  grid: {
                    columns: 12,
                    rows: 'auto',
                    gap: '10px',
                    minRowHeight: '50px',
                  },
                  components: [],
                };
                console.log(`[Preview] No saved content found for "${page.pageName}" - showing empty page`);
                loadPageDefinition(currentPreviewPath, emptyDefinition);
                setPreviewPage(emptyDefinition);
              }
            } else {
              throw apiErr;
            }
          }
        } else {
          // Demo mode - load from localStorage
          const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
          const pageData = savedPages[page.pageSlug];

          if (pageData) {
            // Preload plugins before rendering
            setIsLoadingPlugins(true);
            try {
              await preloadPluginsForPage(pageData);
            } finally {
              setIsLoadingPlugins(false);
            }

            loadPageDefinition(currentPreviewPath, pageData);
            setPreviewPage(pageData);
          } else {
            setError(`Page data not found for: ${page.pageName}`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setIsLoadingPage(false);
      }
    };

    loadPage();
  }, [currentPreviewPath, isActive, pages, effectiveSiteId]);

  // Get current page name for display
  const getCurrentPageName = (): string => {
    const page = pages.find(p => {
      const slug = p.pageSlug?.toLowerCase() || 'home';
      const hasValidRoutePath = p.routePath && p.routePath.trim() !== '';
      const pagePath = hasValidRoutePath ? p.routePath : (slug === 'home' ? '/' : `/${slug}`);
      return pagePath === currentPreviewPath;
    });
    return page?.pageName || previewPage?.pageName || 'Preview';
  };

  // Handle page selection from dropdown
  const handlePageSelect = (path: string) => {
    navigateToPage(path);
  };

  return (
    <div className="multi-page-preview">
      {/* Preview Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-toolbar-left">
          {/* Navigation Controls */}
          <div className="nav-controls">
            <button
              className="nav-btn"
              onClick={goBack}
              disabled={!canGoBack()}
              title="Go Back"
            >
              ←
            </button>
            <button
              className="nav-btn"
              onClick={goForward}
              disabled={!canGoForward()}
              title="Go Forward"
            >
              →
            </button>
          </div>

          {/* Address Bar */}
          <div className="address-bar">
            <span className="protocol">preview://</span>
            <span className="path">{currentPreviewPath}</span>
          </div>
        </div>

        <div className="preview-toolbar-center">
          {/* Page Selector */}
          <div className="page-selector-dropdown">
            <select
              value={currentPreviewPath}
              onChange={(e) => handlePageSelect(e.target.value)}
            >
              {pages.map(page => {
                const slug = page.pageSlug?.toLowerCase() || 'home';
                const hasValidRoutePath = page.routePath && page.routePath.trim() !== '';
                const path = hasValidRoutePath ? page.routePath : (slug === 'home' ? '/' : `/${slug}`);
                return (
                  <option key={page.id} value={path}>
                    {page.pageName} ({path})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="preview-toolbar-right">
          {/* Device Size Selector */}
          <BreakpointToggle />

          <button
            className="exit-preview-btn"
            onClick={onExitPreview}
            title="Exit Preview"
          >
            ✕ Exit Preview
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="preview-content">
        {isLoadingPage || isLoadingPlugins ? (
          <div className="preview-loading">
            <div className="loading-spinner" />
            <p>{isLoadingPlugins ? 'Loading plugins...' : 'Loading page...'}</p>
          </div>
        ) : error ? (
          <div className="preview-error">
            <div className="error-icon">⚠️</div>
            <h3>Page Not Found</h3>
            <p>{error}</p>
            <button onClick={() => navigateToPage('/')}>Go to Home</button>
          </div>
        ) : (
          <div className={`preview-responsive-wrapper ${canvasWidth ? 'width-constrained' : ''} ${canvasWidth && canvasWidth <= 575 ? 'mobile-width' : ''}`}>
            <div
              className="preview-width-container"
              style={{
                maxWidth: canvasWidth ? `${canvasWidth}px` : '100%',
                transition: 'max-width 0.3s ease',
              }}
            >
              <PreviewNavigationInterceptor enabled={isActive}>
                <BuilderCanvas
                  key={`preview-${currentPreviewPath}-${previewPage?.pageName || 'empty'}`}
                  pageOverride={previewPage}
                />
              </PreviewNavigationInterceptor>
            </div>
          </div>
        )}
      </div>

      {/* Page Indicator */}
      <div className="preview-page-indicator">
        <span className="current-page-name">{getCurrentPageName()}</span>
        <span className="page-count">
          {pages.length > 0 && (() => {
            const idx = pages.findIndex(p => {
              const slug = p.pageSlug?.toLowerCase() || 'home';
              const hasValidRoutePath = p.routePath && p.routePath.trim() !== '';
              const pagePath = hasValidRoutePath ? p.routePath : (slug === 'home' ? '/' : `/${slug}`);
              return pagePath === currentPreviewPath;
            });
            return `(${idx + 1} of ${pages.length} pages)`;
          })()}
        </span>
      </div>
    </div>
  );
};

export default MultiPagePreview;
