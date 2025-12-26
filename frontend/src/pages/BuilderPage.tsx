import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBuilderStore } from '../stores/builderStore';
import { LeftSidebar } from '../components/builder/LeftSidebar';
import { BuilderCanvas } from '../components/builder/BuilderCanvas';
import { PropertiesPanel } from '../components/builder/PropertiesPanel';
import { CSSEditor } from '../components/editor/CSSEditor';
import { CanvasRuler } from '../components/builder/CanvasRuler';
import { ImageRepositoryModal } from '../components/builder/ImageRepositoryModal';
import { pageService } from '../services/pageService';
import { PageDefinition } from '../types/builder';
import './BuilderPage.css';

interface BuilderPageParams {
  siteId: string;
  pageId: string;
}

/**
 * BuilderPage - Main visual site builder page
 * Integrates all builder components into a cohesive interface
 */
export const BuilderPage: React.FC = () => {
  const { siteId, pageId } = useParams<Record<string, string>>();
  const navigate = useNavigate();

  const [showCSSEditor, setShowCSSEditor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | 'saving' | 'error'>('saved');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [showImageRepository, setShowImageRepository] = useState(false);
  const contentMenuRef = useRef<HTMLDivElement>(null);

  const {
    currentPage,
    selectedComponentId,
    viewMode,
    isLoading,
    error,
    setCurrentPage,
    setViewMode,
    setLoading,
    setError,
    undo,
    redo,
    canUndo,
    canRedo,
    saveSnapshot
  } = useBuilderStore();

  // Load page data on mount
  useEffect(() => {
    if (siteId && pageId) {
      loadPage(parseInt(siteId), parseInt(pageId));
    } else {
      // Create new page
      initializeNewPage();
    }
  }, [siteId, pageId]);

  // Auto-save on changes
  useEffect(() => {
    if (currentPage && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  }, [currentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+Z / Cmd+Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo()) {
          undo();
        }
      }

      // Ctrl+Shift+Z / Cmd+Shift+Z - Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        if (canRedo()) {
          redo();
        }
      }

      // Ctrl+E / Cmd+E - Toggle CSS Editor
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        setShowCSSEditor(!showCSSEditor);
      }

      // Escape - Close panels
      if (e.key === 'Escape') {
        setShowCSSEditor(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, showCSSEditor]);

  // Close content menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contentMenuRef.current && !contentMenuRef.current.contains(e.target as Node)) {
        setShowContentMenu(false);
      }
    };

    if (showContentMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showContentMenu]);

  const loadPage = async (siteId: number, pageId: number) => {
    setLoading(true);
    setError(null);

    try {
      const pageDefinition = await pageService.getPageDefinition(siteId, pageId);
      setCurrentPage(pageDefinition);
      setSaveStatus('saved');
      setLastSaved(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  };

  const initializeNewPage = () => {
    // Try to load from localStorage first
    const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
    const lastSavedKey = Object.keys(savedPages).pop();

    if (lastSavedKey && savedPages[lastSavedKey]) {
      const savedPage = savedPages[lastSavedKey];
      console.log('Loading saved page from localStorage:', lastSavedKey);
      setCurrentPage(savedPage);
      setSaveStatus('saved');
      setLastSaved(savedPage.savedAt ? new Date(savedPage.savedAt) : null);
      return;
    }

    // Create new page if nothing saved
    const newPage: PageDefinition = {
      version: '1.0',
      pageName: 'New Page',
      grid: {
        columns: 12,
        rows: 'auto',
        gap: '20px',
        minRowHeight: '50px'
      },
      components: [],
      globalStyles: {
        cssVariables: {},
        customCSS: ''
      }
    };

    setCurrentPage(newPage);
    setSaveStatus('unsaved');
  };

  const handleSave = async () => {
    if (!currentPage) {
      alert('Cannot save: No page data available');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');

    try {
      // If we have siteId and pageId, save to backend
      if (siteId && pageId) {
        await pageService.savePageVersion(
          parseInt(siteId),
          parseInt(pageId),
          currentPage,
          'Manual save'
        );
      } else {
        // Save to localStorage for demo/new pages
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');
        const pageKey = currentPage.pageName.replace(/\s+/g, '-').toLowerCase() || 'untitled';
        savedPages[pageKey] = {
          ...currentPage,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem('builder_saved_pages', JSON.stringify(savedPages));
        console.log('Page saved to localStorage:', pageKey);
      }

      setSaveStatus('saved');
      setLastSaved(new Date());
      saveSnapshot('Manual save');
    } catch (err) {
      setSaveStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to save page');
      alert('Failed to save page. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!siteId || !pageId) return;

    if (!confirm('Are you sure you want to publish this page? It will be visible to users.')) {
      return;
    }

    try {
      // Save first
      await handleSave();

      // Then publish
      await pageService.publishPage(parseInt(siteId), parseInt(pageId));
      alert('Page published successfully!');
    } catch (err) {
      alert('Failed to publish page: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handlePreview = () => {
    setViewMode(viewMode === 'edit' ? 'preview' : 'edit');
  };

  const handleExport = () => {
    if (!currentPage) return;

    const dataStr = JSON.stringify(currentPage, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentPage.pageName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCSSChange = (css: string) => {
    // Parse CSS and update selected component styles
    if (selectedComponentId && currentPage) {
      // This is a simplified version - in production, use a proper CSS parser
      const component = currentPage.components.find(c => c.instanceId === selectedComponentId);
      if (component) {
        // Update component styles
        useBuilderStore.getState().updateComponentStyles(selectedComponentId, component.styles);
      }
    }
  };

  const getCSSForSelectedComponent = (): string => {
    if (!selectedComponentId || !currentPage) return '';

    const component = currentPage.components.find(c => c.instanceId === selectedComponentId);
    if (!component) return '';

    // Convert styles object to CSS string
    return Object.entries(component.styles)
      .map(([property, value]) => `${property}: ${value};`)
      .join('\n');
  };

  const formatLastSaved = (): string => {
    if (!lastSaved) return 'Never';

    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return lastSaved.toLocaleDateString();
  };

  return (
    <div className={`builder-page ${viewMode === 'preview' ? 'preview-mode' : ''}`}>
      {/* Top Toolbar - Show minimal toolbar in preview mode */}
      {viewMode === 'preview' ? (
        <div className="builder-toolbar preview-toolbar">
          <div className="toolbar-center">
            <button
              className="toolbar-button primary-button"
              onClick={handlePreview}
              title="Exit Preview (Press P or Escape)"
            >
              ✏ Exit Preview
            </button>
          </div>
        </div>
      ) : (
        <div className="builder-toolbar">
          <div className="toolbar-left">
            <button
              className="toolbar-button back-button"
              onClick={() => navigate(-1)}
              title="Back"
            >
              ← Back
            </button>

            <div className="page-title">
              <input
                type="text"
                value={currentPage?.pageName || ''}
                onChange={(e) => {
                  if (currentPage) {
                    setCurrentPage({ ...currentPage, pageName: e.target.value });
                  }
                }}
                placeholder="Page Name"
                className="page-name-input"
              />
            </div>

            <div className="save-status">
              <span className={`status-indicator status-${saveStatus}`}>
                {saveStatus === 'saved' && '✓'}
                {saveStatus === 'unsaved' && '●'}
                {saveStatus === 'saving' && '↻'}
                {saveStatus === 'error' && '⚠'}
              </span>
              <span className="status-text">
                {saveStatus === 'saved' && `Saved ${formatLastSaved()}`}
                {saveStatus === 'unsaved' && 'Unsaved changes'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'error' && 'Save failed'}
              </span>
            </div>
          </div>

          <div className="toolbar-center">
            <div className="action-group">
              <button
                className="toolbar-button"
                onClick={undo}
                disabled={!canUndo()}
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </button>
              <button
                className="toolbar-button"
                onClick={redo}
                disabled={!canRedo()}
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷ Redo
              </button>
            </div>

            <div className="action-group">
              <button
                className={`toolbar-button ${viewMode === 'preview' ? 'active' : ''}`}
                onClick={handlePreview}
                title="Toggle Preview"
              >
                {viewMode === 'edit' ? '👁 Preview' : '✏ Edit'}
              </button>
            </div>

            <div className="action-group">
              <button
                className={`toolbar-button ${showCSSEditor ? 'active' : ''}`}
                onClick={() => setShowCSSEditor(!showCSSEditor)}
                disabled={!selectedComponentId}
                title="CSS Editor (Ctrl+E)"
              >
                {} CSS
              </button>
            </div>

            {/* Content Menu */}
            <div className="action-group content-menu-container" ref={contentMenuRef}>
              <button
                className={`toolbar-button ${showContentMenu ? 'active' : ''}`}
                onClick={() => setShowContentMenu(!showContentMenu)}
                title="Content Repository"
              >
                📁 Content ▾
              </button>
              {showContentMenu && (
                <div className="content-dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setShowImageRepository(true);
                      setShowContentMenu(false);
                    }}
                  >
                    🖼️ Image Repository
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="toolbar-right">
            <button
              className="toolbar-button"
              onClick={handleExport}
              title="Export JSON"
            >
              ⬇ Export
            </button>

            <button
              className="toolbar-button primary-button"
              onClick={handleSave}
              disabled={isSaving || saveStatus === 'saved'}
              title="Save (Ctrl+S)"
            >
              {isSaving ? '↻ Saving...' : '💾 Save'}
            </button>

            <button
              className="toolbar-button success-button"
              onClick={handlePublish}
              title="Publish Page"
            >
              🚀 Publish
            </button>
          </div>
        </div>
      )}

      {/* Main Builder Area */}
      <div className={`builder-main ${viewMode === 'preview' ? 'preview-mode' : ''}`}>
        {/* Left Panel - Component Palette (hidden in preview mode) */}
        {viewMode === 'edit' && (
          <div className={`builder-panel left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
            <button
              className="panel-toggle"
              onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              title={leftPanelCollapsed ? 'Show Components' : 'Hide Components'}
            >
              {leftPanelCollapsed ? '▶' : '◀'}
            </button>
            {!leftPanelCollapsed && <LeftSidebar />}
          </div>
        )}

        {/* Center - Canvas */}
        <div className="builder-canvas-area">
          {/* Canvas Ruler - only show in edit mode */}
          {viewMode === 'edit' && <CanvasRuler />}

          {isLoading ? (
            <div className="builder-loading">
              <div className="loading-spinner"></div>
              <p>Loading page...</p>
            </div>
          ) : error ? (
            <div className="builder-error">
              <div className="error-icon">⚠️</div>
              <h3>Failed to load page</h3>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-button">
                Retry
              </button>
            </div>
          ) : (
            <BuilderCanvas onComponentSelect={(id) => useBuilderStore.getState().selectComponent(id)} />
          )}

          {/* CSS Editor Modal */}
          {showCSSEditor && selectedComponentId && (
            <div className="css-editor-modal">
              <div className="modal-content">
                <div className="modal-header">
                  <h3>CSS Editor</h3>
                  <button
                    className="close-button"
                    onClick={() => setShowCSSEditor(false)}
                    title="Close (Esc)"
                  >
                    ✕
                  </button>
                </div>
                <CSSEditor
                  value={getCSSForSelectedComponent()}
                  onChange={handleCSSChange}
                  componentId={selectedComponentId}
                  height="500px"
                />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties (hidden in preview mode) */}
        {viewMode === 'edit' && (
          <div className={`builder-panel right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
            <button
              className="panel-toggle"
              onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              title={rightPanelCollapsed ? 'Show Properties' : 'Hide Properties'}
            >
              {rightPanelCollapsed ? '◀' : '▶'}
            </button>
            {!rightPanelCollapsed && <PropertiesPanel selectedComponentId={selectedComponentId} />}
          </div>
        )}
      </div>

      {/* Bottom Status Bar (hidden in preview mode) */}
      {viewMode === 'edit' && (
        <div className="builder-status-bar">
          <div className="status-left">
            <span className="status-item">
              Grid: {currentPage?.grid.columns} columns × {currentPage?.grid.gap} gap
            </span>
            <span className="status-item">
              Components: {currentPage?.components.length || 0}
            </span>
          </div>

          <div className="status-right">
            <span className="status-item">
              ✏ Edit Mode
            </span>
            {selectedComponentId && (
              <span className="status-item">
                Selected: {currentPage?.components.find(c => c.instanceId === selectedComponentId)?.componentId}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help (hidden in preview mode) */}
      {viewMode === 'edit' && (
        <div className="keyboard-shortcuts-hint">
          <small>
            Shortcuts: Ctrl+S (Save) | Ctrl+Z (Undo) | Ctrl+Shift+Z (Redo) | Ctrl+E (CSS Editor) | Delete (Remove)
          </small>
        </div>
      )}

      {/* Image Repository Modal */}
      <ImageRepositoryModal
        isOpen={showImageRepository}
        onClose={() => setShowImageRepository(false)}
      />
    </div>
  );
};
