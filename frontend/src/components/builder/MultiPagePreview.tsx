import React, { useEffect, useState, useCallback } from 'react';
import { useMultiPagePreviewStore } from '../../stores/multiPagePreviewStore';
import { useBuilderStore } from '../../stores/builderStore';
import { PreviewNavigationInterceptor } from './PreviewNavigationInterceptor';
import { BuilderCanvas } from './BuilderCanvas';
import { Page } from '../../types/site';
import { PageDefinition } from '../../types/builder';
import { pageService } from '../../services/pageService';
import './MultiPagePreview.css';

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
  const [error, setError] = useState<string | null>(null);

  const {
    isActive,
    pages,
    currentPreviewPath,
    setActive,
    setPages,
    navigateToPage,
    loadPageDefinition,
    getPageDefinition,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useMultiPagePreviewStore();

  const { currentPage, setCurrentPage } = useBuilderStore();

  // Initialize preview mode
  useEffect(() => {
    setActive(true);

    // Load pages
    if (initialPages.length > 0) {
      setPages(initialPages);

      // Cache all page definitions from localStorage for demo mode
      if (!siteId) {
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
        const startPath = startPage.routePath || `/${startPage.pageSlug}`;

        // Cache the current page definition under its correct path
        if (currentPage && currentEditingPage) {
          loadPageDefinition(startPath, currentPage);
        }

        navigateToPage(startPath);
      }
    } else {
      loadPagesFromStorage();

      // Store current page as the initial page for fallback
      if (currentPage) {
        const initialPath = '/';
        loadPageDefinition(initialPath, currentPage);
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
  useEffect(() => {
    if (!isActive) return;

    const loadPage = async () => {
      // Check if page is already loaded
      const cachedPage = getPageDefinition(currentPreviewPath);
      if (cachedPage) {
        setCurrentPage(cachedPage);
        return;
      }

      // Find the page metadata
      const page = pages.find(p => {
        const pagePath = p.routePath || `/${p.pageSlug}`;
        return pagePath === currentPreviewPath || `/${p.pageSlug}` === currentPreviewPath;
      });

      if (!page) {
        // Check localStorage for demo mode
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
        const slug = currentPreviewPath === '/' ? 'home' : currentPreviewPath.slice(1);
        const localPage = savedPages[slug];

        if (localPage) {
          loadPageDefinition(currentPreviewPath, localPage);
          setCurrentPage(localPage);
          return;
        }

        setError(`Page not found: ${currentPreviewPath}`);
        return;
      }

      setIsLoadingPage(true);
      setError(null);

      try {
        if (siteId) {
          // Load from backend
          const definition = await pageService.getPageDefinition(siteId, page.id);
          loadPageDefinition(currentPreviewPath, definition);
          setCurrentPage(definition);
        } else {
          // Demo mode - load from localStorage
          const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
          const pageData = savedPages[page.pageSlug];

          if (pageData) {
            loadPageDefinition(currentPreviewPath, pageData);
            setCurrentPage(pageData);
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
  }, [currentPreviewPath, isActive, pages, siteId]);

  // Get current page name for display
  const getCurrentPageName = (): string => {
    const page = pages.find(p => {
      const pagePath = p.routePath || `/${p.pageSlug}`;
      return pagePath === currentPreviewPath;
    });
    return page?.pageName || currentPage?.pageName || 'Preview';
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
                const path = page.routePath || `/${page.pageSlug}`;
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
        {isLoadingPage ? (
          <div className="preview-loading">
            <div className="loading-spinner" />
            <p>Loading page...</p>
          </div>
        ) : error ? (
          <div className="preview-error">
            <div className="error-icon">⚠️</div>
            <h3>Page Not Found</h3>
            <p>{error}</p>
            <button onClick={() => navigateToPage('/')}>Go to Home</button>
          </div>
        ) : (
          <PreviewNavigationInterceptor enabled={isActive}>
            <BuilderCanvas />
          </PreviewNavigationInterceptor>
        )}
      </div>

      {/* Page Indicator */}
      <div className="preview-page-indicator">
        <span className="current-page-name">{getCurrentPageName()}</span>
        <span className="page-count">
          {pages.length > 0 && `(${pages.findIndex(p => (p.routePath || `/${p.pageSlug}`) === currentPreviewPath) + 1} of ${pages.length} pages)`}
        </span>
      </div>
    </div>
  );
};

export default MultiPagePreview;
