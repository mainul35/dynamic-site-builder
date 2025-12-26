import React, { useState, useEffect } from 'react';
import { Page } from '../../types/site';
import { pageService } from '../../services/pageService';
import './PageLinkSelector.css';

interface PageLinkSelectorProps {
  value: string;
  onChange: (value: string) => void;
  siteId?: number | null;
  placeholder?: string;
  showExternalOption?: boolean;
}

/**
 * PageLinkSelector - A dropdown component that allows selecting internal pages
 * or entering external URLs for navigation links
 */
export const PageLinkSelector: React.FC<PageLinkSelectorProps> = ({
  value,
  onChange,
  siteId,
  placeholder = 'Select page or enter URL',
  showExternalOption = true,
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'page' | 'external'>('page');
  const [isOpen, setIsOpen] = useState(false);

  // Determine initial mode based on value
  useEffect(() => {
    if (value) {
      // Check if value looks like an external URL (starts with http:// or https://)
      if (value.startsWith('http://') || value.startsWith('https://')) {
        setMode('external');
      } else {
        setMode('page');
      }
    }
  }, []);

  // Load pages
  useEffect(() => {
    loadPages();
  }, [siteId]);

  const loadPages = async () => {
    setIsLoading(true);

    try {
      if (siteId) {
        const fetchedPages = await pageService.getAllPages(siteId);
        setPages(fetchedPages);
      } else {
        // Demo mode - load from localStorage
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
        const demoPages: Page[] = Object.entries(savedPages).map(([key, val]: [string, any], index) => ({
          id: index + 1,
          siteId: 0,
          pageName: val.pageName || key,
          pageSlug: key,
          pageType: val.pageType || 'standard',
          routePath: `/${key}`,
          displayOrder: index,
          isPublished: false,
          createdAt: val.savedAt || new Date().toISOString(),
          updatedAt: val.savedAt || new Date().toISOString(),
        }));

        // Add default pages if none exist
        if (demoPages.length === 0) {
          demoPages.push(
            {
              id: 1,
              siteId: 0,
              pageName: 'Home',
              pageSlug: 'home',
              pageType: 'homepage',
              routePath: '/',
              displayOrder: 0,
              isPublished: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 2,
              siteId: 0,
              pageName: 'About',
              pageSlug: 'about',
              pageType: 'standard',
              routePath: '/about',
              displayOrder: 1,
              isPublished: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            {
              id: 3,
              siteId: 0,
              pageName: 'Contact',
              pageSlug: 'contact',
              pageType: 'standard',
              routePath: '/contact',
              displayOrder: 2,
              isPublished: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          );
        }

        setPages(demoPages);
      }
    } catch (err) {
      console.error('Error loading pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageSelect = (page: Page) => {
    const path = page.routePath || `/${page.pageSlug}`;
    onChange(path);
    setIsOpen(false);
  };

  const handleExternalUrlChange = (url: string) => {
    onChange(url);
  };

  const getSelectedPageName = (): string => {
    if (!value || mode === 'external') return '';
    const page = pages.find(p => p.routePath === value || `/${p.pageSlug}` === value);
    return page?.pageName || '';
  };

  const getPageIcon = (page: Page): string => {
    if (page.pageType === 'homepage' || page.routePath === '/') return '🏠';
    if (page.pageType === 'template') return '📐';
    return '📄';
  };

  return (
    <div className="page-link-selector">
      {/* Mode Toggle */}
      {showExternalOption && (
        <div className="link-mode-toggle">
          <button
            type="button"
            className={`mode-btn ${mode === 'page' ? 'active' : ''}`}
            onClick={() => setMode('page')}
          >
            Internal Page
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'external' ? 'active' : ''}`}
            onClick={() => setMode('external')}
          >
            External URL
          </button>
        </div>
      )}

      {mode === 'page' ? (
        <div className="page-selector">
          <button
            type="button"
            className="page-selector-trigger"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isLoading ? (
              <span className="loading-text">Loading pages...</span>
            ) : value ? (
              <span className="selected-page">
                <span className="page-icon">{getPageIcon(pages.find(p => p.routePath === value || `/${p.pageSlug}` === value) || {} as Page)}</span>
                <span className="page-name">{getSelectedPageName() || value}</span>
              </span>
            ) : (
              <span className="placeholder">{placeholder}</span>
            )}
            <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
          </button>

          {isOpen && (
            <div className="page-dropdown">
              {pages.length === 0 ? (
                <div className="no-pages">No pages available</div>
              ) : (
                <>
                  {/* Common sections */}
                  <div className="dropdown-section-header">Section Links</div>
                  <button
                    type="button"
                    className="page-option section-link"
                    onClick={() => {
                      onChange('#');
                      setIsOpen(false);
                    }}
                  >
                    <span className="page-icon">#</span>
                    <span className="page-name">Current Page (anchor)</span>
                  </button>
                  <button
                    type="button"
                    className="page-option section-link"
                    onClick={() => {
                      onChange('#top');
                      setIsOpen(false);
                    }}
                  >
                    <span className="page-icon">↑</span>
                    <span className="page-name">Top of Page</span>
                  </button>

                  <div className="dropdown-section-header">Site Pages</div>
                  {pages.map(page => (
                    <button
                      key={page.id}
                      type="button"
                      className={`page-option ${value === (page.routePath || `/${page.pageSlug}`) ? 'selected' : ''}`}
                      onClick={() => handlePageSelect(page)}
                    >
                      <span className="page-icon">{getPageIcon(page)}</span>
                      <span className="page-name">{page.pageName}</span>
                      <span className="page-path">{page.routePath || `/${page.pageSlug}`}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="external-url-input">
          <input
            type="url"
            value={value || ''}
            onChange={(e) => handleExternalUrlChange(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
      )}

      {/* Current Value Display */}
      {value && (
        <div className="current-value">
          <span className="value-label">Link:</span>
          <span className="value-text">{value}</span>
          <button
            type="button"
            className="clear-btn"
            onClick={() => onChange('')}
            title="Clear link"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};

export default PageLinkSelector;
