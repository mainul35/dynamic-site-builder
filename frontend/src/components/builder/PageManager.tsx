import React, { useState, useEffect, useCallback } from 'react';
import { Page, CreatePageRequest } from '../../types/site';
import { pageService } from '../../services/pageService';
import './PageManager.css';

interface PageManagerProps {
  siteId: number | null;
  currentPageId: number | null;
  onPageSelect: (page: Page) => void;
  onPageCreate?: (page: Page) => void;
  onPageDelete?: (pageId: number) => void;
}

/**
 * PageManager - Component for managing pages within a site
 * Displays page list, allows creating, renaming, duplicating, and deleting pages
 */
export const PageManager: React.FC<PageManagerProps> = ({
  siteId,
  currentPageId,
  onPageSelect,
  onPageCreate,
  onPageDelete,
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [contextMenuPageId, setContextMenuPageId] = useState<number | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  // Load pages when siteId changes
  useEffect(() => {
    if (siteId) {
      loadPages();
    } else {
      // Demo mode - load from localStorage
      loadDemoPages();
    }
  }, [siteId]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenuPageId(null);
    };

    if (contextMenuPageId !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenuPageId]);

  const loadPages = async () => {
    if (!siteId) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedPages = await pageService.getAllPages(siteId);
      setPages(fetchedPages);
    } catch (err) {
      setError('Failed to load pages');
      console.error('Error loading pages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDemoPages = () => {
    // Load demo pages from localStorage
    const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
    const demoPages: Page[] = Object.entries(savedPages).map(([key, value]: [string, any], index) => ({
      id: index + 1,
      siteId: 0,
      pageName: value.pageName || key,
      pageSlug: key,
      pageType: value.pageType || 'standard',
      routePath: `/${key}`,
      displayOrder: index,
      isPublished: false,
      createdAt: value.savedAt || new Date().toISOString(),
      updatedAt: value.savedAt || new Date().toISOString(),
    }));

    // Always add a "New Page" option if no pages exist
    if (demoPages.length === 0) {
      demoPages.push({
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
      });
    }

    setPages(demoPages);
  };

  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;

    const slug = newPageSlug.trim() || newPageName.toLowerCase().replace(/\s+/g, '-');

    if (siteId) {
      try {
        const createRequest: CreatePageRequest = {
          pageName: newPageName,
          pageSlug: slug,
          pageType: 'standard',
          routePath: `/${slug}`,
        };

        const newPage = await pageService.createPage(siteId, createRequest);
        setPages([...pages, newPage]);
        onPageCreate?.(newPage);
        setShowCreateModal(false);
        setNewPageName('');
        setNewPageSlug('');
      } catch (err) {
        setError('Failed to create page');
        console.error('Error creating page:', err);
      }
    } else {
      // Demo mode - create in localStorage
      const newPage: Page = {
        id: Date.now(),
        siteId: 0,
        pageName: newPageName,
        pageSlug: slug,
        pageType: 'standard',
        routePath: `/${slug}`,
        displayOrder: pages.length,
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save empty page definition to localStorage
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      savedPages[slug] = {
        version: '1.0',
        pageName: newPageName,
        grid: { columns: 12, rows: 'auto', gap: '20px', minRowHeight: '50px' },
        components: [],
        globalStyles: { cssVariables: {}, customCSS: '' },
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));

      setPages([...pages, newPage]);
      onPageCreate?.(newPage);
      setShowCreateModal(false);
      setNewPageName('');
      setNewPageSlug('');
    }
  };

  const handleDeletePage = async (pageId: number) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (!window.confirm(`Are you sure you want to delete "${page.pageName}"? This cannot be undone.`)) {
      return;
    }

    if (siteId) {
      try {
        await pageService.deletePage(siteId, pageId);
        setPages(pages.filter(p => p.id !== pageId));
        onPageDelete?.(pageId);
      } catch (err) {
        setError('Failed to delete page');
        console.error('Error deleting page:', err);
      }
    } else {
      // Demo mode - delete from localStorage
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      delete savedPages[page.pageSlug];
      localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));

      setPages(pages.filter(p => p.id !== pageId));
      onPageDelete?.(pageId);
    }

    setContextMenuPageId(null);
  };

  const handleDuplicatePage = async (pageId: number) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    const newName = `${page.pageName} (Copy)`;
    const newSlug = `${page.pageSlug}-copy-${Date.now()}`;

    if (siteId) {
      try {
        const duplicatedPage = await pageService.duplicatePage(siteId, pageId, newName);
        setPages([...pages, duplicatedPage]);
      } catch (err) {
        setError('Failed to duplicate page');
        console.error('Error duplicating page:', err);
      }
    } else {
      // Demo mode - duplicate in localStorage
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      const originalPageData = savedPages[page.pageSlug];

      if (originalPageData) {
        savedPages[newSlug] = {
          ...originalPageData,
          pageName: newName,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));

        const duplicatedPage: Page = {
          ...page,
          id: Date.now(),
          pageName: newName,
          pageSlug: newSlug,
          routePath: `/${newSlug}`,
          displayOrder: pages.length,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setPages([...pages, duplicatedPage]);
      }
    }

    setContextMenuPageId(null);
  };

  const handleRenameStart = (page: Page) => {
    setEditingPageId(page.id);
    setEditingName(page.pageName);
    setContextMenuPageId(null);
  };

  const handleRenameSubmit = async () => {
    if (!editingPageId || !editingName.trim()) {
      setEditingPageId(null);
      return;
    }

    const page = pages.find(p => p.id === editingPageId);
    if (!page) return;

    if (siteId) {
      try {
        await pageService.updatePage(siteId, editingPageId, { pageName: editingName });
        setPages(pages.map(p =>
          p.id === editingPageId ? { ...p, pageName: editingName } : p
        ));
      } catch (err) {
        setError('Failed to rename page');
        console.error('Error renaming page:', err);
      }
    } else {
      // Demo mode - update in localStorage
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      if (savedPages[page.pageSlug]) {
        savedPages[page.pageSlug].pageName = editingName;
        localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));
      }

      setPages(pages.map(p =>
        p.id === editingPageId ? { ...p, pageName: editingName } : p
      ));
    }

    setEditingPageId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, pageId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPageId(pageId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const handleSetHomepage = async (pageId: number) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (siteId) {
      try {
        await pageService.updatePage(siteId, pageId, { routePath: '/' });
        // Update other pages that had homepage route
        for (const p of pages) {
          if (p.id !== pageId && p.routePath === '/') {
            await pageService.updatePage(siteId, p.id, { routePath: `/${p.pageSlug}` });
          }
        }
        loadPages();
      } catch (err) {
        setError('Failed to set homepage');
        console.error('Error setting homepage:', err);
      }
    } else {
      // Demo mode
      setPages(pages.map(p => ({
        ...p,
        routePath: p.id === pageId ? '/' : `/${p.pageSlug}`,
        pageType: p.id === pageId ? 'homepage' : 'standard',
      })));
    }

    setContextMenuPageId(null);
  };

  const getPageIcon = (page: Page): string => {
    if (page.pageType === 'homepage' || page.routePath === '/') return '🏠';
    if (page.pageType === 'template') return '📐';
    return '📄';
  };

  return (
    <div className="page-manager">
      {/* Header */}
      <div className="page-manager-header">
        <h3>Pages</h3>
        <button
          className="add-page-button"
          onClick={() => setShowCreateModal(true)}
          title="Create new page"
        >
          + New
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="page-manager-error">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="page-manager-loading">
          <span className="loading-spinner-small" />
          Loading pages...
        </div>
      )}

      {/* Pages list */}
      <div className="pages-list">
        {pages.length === 0 && !isLoading ? (
          <div className="no-pages-message">
            <p>No pages yet.</p>
            <button
              className="create-first-page-button"
              onClick={() => setShowCreateModal(true)}
            >
              Create your first page
            </button>
          </div>
        ) : (
          pages.map(page => (
            <div
              key={page.id}
              className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
              onClick={() => onPageSelect(page)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
            >
              <span className="page-icon">{getPageIcon(page)}</span>

              {editingPageId === page.id ? (
                <input
                  type="text"
                  className="page-name-edit"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={handleRenameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit();
                    if (e.key === 'Escape') setEditingPageId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="page-name">{page.pageName}</span>
              )}

              <span className="page-path" title={page.routePath}>
                {page.routePath || `/${page.pageSlug}`}
              </span>

              {page.isPublished && (
                <span className="published-badge" title="Published">●</span>
              )}

              <button
                className="page-menu-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, page.id);
                }}
                title="Page options"
              >
                ⋮
              </button>
            </div>
          ))
        )}
      </div>

      {/* Context Menu */}
      {contextMenuPageId !== null && (
        <div
          className="page-context-menu"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => {
            const page = pages.find(p => p.id === contextMenuPageId);
            if (page) handleRenameStart(page);
          }}>
            ✏️ Rename
          </button>
          <button onClick={() => handleDuplicatePage(contextMenuPageId)}>
            📋 Duplicate
          </button>
          <button onClick={() => handleSetHomepage(contextMenuPageId)}>
            🏠 Set as Homepage
          </button>
          <div className="context-menu-divider" />
          <button
            className="danger"
            onClick={() => handleDeletePage(contextMenuPageId)}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {/* Create Page Modal */}
      {showCreateModal && (
        <div className="create-page-modal" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Page</h3>
              <button
                className="close-button"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="pageName">Page Name</label>
                <input
                  id="pageName"
                  type="text"
                  value={newPageName}
                  onChange={(e) => {
                    setNewPageName(e.target.value);
                    // Auto-generate slug from name
                    if (!newPageSlug || newPageSlug === newPageName.toLowerCase().replace(/\s+/g, '-')) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }
                  }}
                  placeholder="e.g., About Us"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="pageSlug">URL Slug</label>
                <input
                  id="pageSlug"
                  type="text"
                  value={newPageSlug}
                  onChange={(e) => setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  placeholder="e.g., about-us"
                />
                <small className="form-hint">
                  The page will be accessible at: /{newPageSlug || 'page-slug'}
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="create-button"
                onClick={handleCreatePage}
                disabled={!newPageName.trim()}
              >
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageManager;
