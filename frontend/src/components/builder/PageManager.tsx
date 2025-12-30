import React, { useState, useEffect } from 'react';
import { Page, CreatePageRequest } from '../../types/site';
import { useSiteManagerStore } from '../../stores/siteManagerStore';
import { PageTree } from '../page-tree/PageTree';
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
 * Displays site info, hierarchical page tree, and page management controls
 */
export const PageManager: React.FC<PageManagerProps> = ({
  siteId,
  currentPageId,
  onPageSelect,
  onPageCreate,
  onPageDelete,
}) => {
  // Local state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageParentId, setNewPageParentId] = useState<number | null>(null);
  const [contextMenuPageId, setContextMenuPageId] = useState<number | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [editingPageId, setEditingPageId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Site manager store
  const {
    currentSite,
    pages,
    pageTree,
    isLoadingPages,
    error: storeError,
    selectSite,
    loadSitePages,
    createPage,
    updatePage,
    deletePage,
    duplicatePage,
    clearError,
  } = useSiteManagerStore();

  // Get currentSiteId from store
  const { currentSiteId: storeSiteId } = useSiteManagerStore();

  // Use siteId prop if provided, otherwise use store's currentSiteId
  const effectiveSiteId = siteId ?? storeSiteId;

  // Load site and pages when effective siteId changes
  useEffect(() => {
    if (effectiveSiteId) {
      console.log('[PageManager] Loading site:', effectiveSiteId);
      selectSite(effectiveSiteId);
    }
  }, [effectiveSiteId, selectSite]);

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

  // Handle page selection from tree
  const handlePageSelect = (pageId: number) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      onPageSelect(page);
    }
  };

  // Handle context menu on page
  const handlePageContextMenu = (e: React.MouseEvent, pageId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPageId(pageId);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Create new page
  const handleCreatePage = async () => {
    if (!newPageName.trim()) return;

    const slug = newPageSlug.trim() || newPageName.toLowerCase().replace(/\s+/g, '-');

    if (effectiveSiteId) {
      try {
        const newPage = await createPage({
          pageName: newPageName,
          pageSlug: slug,
          pageType: 'standard',
          routePath: `/${slug}`,
          parentPageId: newPageParentId || undefined,
        });

        if (newPage) {
          onPageCreate?.(newPage);
          setShowCreateModal(false);
          resetCreateForm();
        }
      } catch (err) {
        setLocalError('Failed to create page');
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
        parentPageId: newPageParentId || undefined,
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

      onPageCreate?.(newPage);
      setShowCreateModal(false);
      resetCreateForm();
    }
  };

  const resetCreateForm = () => {
    setNewPageName('');
    setNewPageSlug('');
    setNewPageParentId(null);
  };

  // Delete page
  const handleDeletePage = async (pageId: number) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;

    if (!window.confirm(`Are you sure you want to delete "${page.pageName}"? This cannot be undone.`)) {
      return;
    }

    if (effectiveSiteId) {
      const success = await deletePage(pageId);
      if (success) {
        onPageDelete?.(pageId);
      }
    } else {
      // Demo mode
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      delete savedPages[page.pageSlug];
      localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));
      onPageDelete?.(pageId);
    }

    setContextMenuPageId(null);
  };

  // Duplicate page
  const handleDuplicatePage = async (pageId: number) => {
    if (effectiveSiteId) {
      await duplicatePage(pageId);
    } else {
      // Demo mode
      const page = pages.find(p => p.id === pageId);
      if (!page) return;

      const newSlug = `${page.pageSlug}-copy-${Date.now()}`;
      const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
      const originalPageData = savedPages[page.pageSlug];

      if (originalPageData) {
        savedPages[newSlug] = {
          ...originalPageData,
          pageName: `${page.pageName} (Copy)`,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));
      }
    }

    setContextMenuPageId(null);
  };

  // Rename page
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

    if (effectiveSiteId) {
      await updatePage(editingPageId, { pageName: editingName });
    } else {
      // Demo mode
      const page = pages.find(p => p.id === editingPageId);
      if (page) {
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
        if (savedPages[page.pageSlug]) {
          savedPages[page.pageSlug].pageName = editingName;
          localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));
        }
      }
    }

    setEditingPageId(null);
  };

  // Set as homepage
  const handleSetHomepage = async (pageId: number) => {
    if (effectiveSiteId) {
      await updatePage(pageId, { routePath: '/' });
    }
    setContextMenuPageId(null);
  };

  // Create subpage
  const handleCreateSubpage = (parentPageId: number) => {
    setNewPageParentId(parentPageId);
    setShowCreateModal(true);
    setContextMenuPageId(null);
  };

  const error = localError || storeError;

  return (
    <div className="page-manager">
      {/* Site Header */}
      <div className="page-manager-site-header">
        {currentSite ? (
          <>
            <div className="site-info">
              <span className="site-icon">🌐</span>
              <div className="site-details">
                <span className="site-name">{currentSite.siteName}</span>
                <span className="site-slug">/{currentSite.siteSlug}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="site-info">
            <span className="site-icon">📁</span>
            <div className="site-details">
              <span className="site-name">Local Project</span>
              <span className="site-slug">Demo Mode</span>
            </div>
          </div>
        )}
      </div>

      {/* Header with New button */}
      <div className="page-manager-header">
        <h3>Pages</h3>
        <button
          className="add-page-button"
          onClick={() => {
            setNewPageParentId(null);
            setShowCreateModal(true);
          }}
          title="Create new page"
        >
          + New
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="page-manager-error">
          <span>{error}</span>
          <button onClick={() => {
            setLocalError(null);
            clearError();
          }}>×</button>
        </div>
      )}

      {/* Loading state */}
      {isLoadingPages && (
        <div className="page-manager-loading">
          <span className="loading-spinner-small" />
          Loading pages...
        </div>
      )}

      {/* Page Tree - Hierarchical Display */}
      {!isLoadingPages && effectiveSiteId && (pageTree.length > 0 || pages.length > 0) ? (
        <div className="page-tree-container">
          <PageTree
            activePageId={currentPageId}
            onPageSelect={handlePageSelect}
            onPageContextMenu={handlePageContextMenu}
          />
        </div>
      ) : !isLoadingPages && !effectiveSiteId ? (
        // Demo mode - flat list with simple styling
        <DemoPagesList
          pages={pages}
          currentPageId={currentPageId}
          editingPageId={editingPageId}
          editingName={editingName}
          onPageSelect={onPageSelect}
          onEditNameChange={setEditingName}
          onEditSubmit={handleRenameSubmit}
          onEditCancel={() => setEditingPageId(null)}
          onContextMenu={handlePageContextMenu}
          onCreatePage={() => setShowCreateModal(true)}
        />
      ) : !isLoadingPages && pages.length === 0 ? (
        <div className="no-pages-message">
          <p>No pages yet.</p>
          <button
            className="create-first-page-button"
            onClick={() => setShowCreateModal(true)}
          >
            Create your first page
          </button>
        </div>
      ) : null}

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
          <button onClick={() => handleCreateSubpage(contextMenuPageId)}>
            ➕ Add Subpage
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
              <h3>{newPageParentId ? 'Create Subpage' : 'Create New Page'}</h3>
              <button
                className="close-button"
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {newPageParentId && (
                <div className="parent-page-info">
                  <span>Parent: </span>
                  <strong>{pages.find(p => p.id === newPageParentId)?.pageName}</strong>
                </div>
              )}

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
                onClick={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
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

/**
 * DemoPagesList - Simple flat page list for demo mode (no siteId)
 */
interface DemoPagesListProps {
  pages: Page[];
  currentPageId: number | null;
  editingPageId: number | null;
  editingName: string;
  onPageSelect: (page: Page) => void;
  onEditNameChange: (name: string) => void;
  onEditSubmit: () => void;
  onEditCancel: () => void;
  onContextMenu: (e: React.MouseEvent, pageId: number) => void;
  onCreatePage: () => void;
}

const DemoPagesList: React.FC<DemoPagesListProps> = ({
  pages,
  currentPageId,
  editingPageId,
  editingName,
  onPageSelect,
  onEditNameChange,
  onEditSubmit,
  onEditCancel,
  onContextMenu,
  onCreatePage,
}) => {
  const getPageIcon = (page: Page): string => {
    if (page.pageType === 'homepage' || page.routePath === '/') return '🏠';
    if (page.pageType === 'template') return '📐';
    return '📄';
  };

  if (pages.length === 0) {
    return (
      <div className="no-pages-message">
        <p>No pages yet.</p>
        <button
          className="create-first-page-button"
          onClick={onCreatePage}
        >
          Create your first page
        </button>
      </div>
    );
  }

  return (
    <div className="pages-list">
      {pages.map(page => (
        <div
          key={page.id}
          className={`page-item ${currentPageId === page.id ? 'active' : ''}`}
          onClick={() => onPageSelect(page)}
          onContextMenu={(e) => onContextMenu(e, page.id)}
        >
          <span className="page-icon">{getPageIcon(page)}</span>

          {editingPageId === page.id ? (
            <input
              type="text"
              className="page-name-edit"
              value={editingName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={onEditSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditSubmit();
                if (e.key === 'Escape') onEditCancel();
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
              onContextMenu(e, page.id);
            }}
            title="Page options"
          >
            ⋮
          </button>
        </div>
      ))}
    </div>
  );
};

export default PageManager;
