import React, { useState, useEffect } from 'react';
import { ModalSection, ModalButton } from '../modals/ModalBase';
import {
  componentAdminService,
  ComponentRegistryEntry,
  PageUsageInfo,
} from '../../services/componentAdminService';
import { ComponentUploadModal } from './ComponentUploadModal';
import { ManifestEditorModal } from './ManifestEditorModal';
import { useComponentStore } from '../../stores/componentStore';
import { ComponentInstance, PageDefinition } from '../../types/builder';
import './ComponentManagementTab.css';

// Extended PageUsageInfo to include source
interface ExtendedPageUsageInfo extends PageUsageInfo {
  source: 'backend' | 'localStorage';
}

// Plugin aliases - maps actual pluginId to virtual aliases
// Same as backend PLUGIN_ALIASES for consistency
const PLUGIN_ALIASES: Record<string, string[]> = {
  'label-component-plugin': ['core-ui'],
  'button-component-plugin': ['core-ui'],
  'container-layout-plugin': ['core-ui', 'core-layout'],
  'textbox-component-plugin': ['core-ui'],
  'image-component-plugin': ['core-ui'],
  'navbar-component-plugin': ['core-navbar'],
};

/**
 * Search localStorage saved pages for component usage
 */
const searchLocalStorageForComponentUsage = (
  pluginId: string,
  componentId: string
): ExtendedPageUsageInfo[] => {
  const results: ExtendedPageUsageInfo[] = [];

  try {
    // Get saved pages from localStorage
    const savedPagesJson = localStorage.getItem('builder_saved_pages');
    if (!savedPagesJson) {
      return results;
    }

    const savedPages: Record<string, PageDefinition & { savedAt?: string }> =
      JSON.parse(savedPagesJson);

    // Build set of pluginIds to search for (actual + aliases + reverse lookup)
    const pluginIdsToSearch = new Set<string>([pluginId]);

    // Add aliases for this pluginId
    const aliases = PLUGIN_ALIASES[pluginId];
    if (aliases) {
      aliases.forEach((alias) => pluginIdsToSearch.add(alias));
    }

    // Reverse lookup - if searching for alias, include actual plugin IDs
    for (const [actualId, aliasList] of Object.entries(PLUGIN_ALIASES)) {
      if (aliasList.includes(pluginId)) {
        pluginIdsToSearch.add(actualId);
      }
    }

    // Search each saved page
    for (const [pageSlug, page] of Object.entries(savedPages)) {
      if (page.components && searchComponentsRecursive(page.components, pluginIdsToSearch, componentId)) {
        results.push({
          pageId: 0, // localStorage pages don't have numeric IDs
          pageName: page.pageName || pageSlug,
          pageSlug: pageSlug,
          siteId: 0,
          siteName: 'Local Storage',
          source: 'localStorage',
        });
      }
    }
  } catch (error) {
    console.error('Error searching localStorage for component usage:', error);
  }

  return results;
};

/**
 * Recursively search components array for a specific component
 */
const searchComponentsRecursive = (
  components: ComponentInstance[],
  pluginIds: Set<string>,
  componentId: string
): boolean => {
  for (const component of components) {
    // Check if this component matches (case-insensitive componentId comparison)
    const componentIdMatches = component.componentId.toLowerCase() === componentId.toLowerCase();
    if (componentIdMatches && pluginIds.has(component.pluginId)) {
      return true;
    }

    // Search children recursively
    if (component.children && component.children.length > 0) {
      if (searchComponentsRecursive(component.children, pluginIds, componentId)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * ComponentManagementTab - Admin section for managing registered components
 * Allows activation/deactivation, deletion, and registration of components.
 */
export const ComponentManagementTab: React.FC = () => {
  const [components, setComponents] = useState<ComponentRegistryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Get triggerRefresh from component store to sync palette after admin actions
  const { triggerRefresh } = useComponentStore();

  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Usage modal state
  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [usageInfo, setUsageInfo] = useState<{
    componentId: string;
    componentName: string;
    pages: ExtendedPageUsageInfo[];
    isDeleteBlocked?: boolean; // True when user tried to delete but component has usage
  } | null>(null);

  // Confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deactivate';
    pluginId: string;
    componentId: string;
    componentName: string;
    affectedPages?: PageUsageInfo[];
  } | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Manifest editor modal state
  const [manifestEditorOpen, setManifestEditorOpen] = useState(false);

  // Load components on mount
  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await componentAdminService.getAllComponents();
      setComponents(data);
    } catch (err) {
      setError('Failed to load components');
      console.error('Error loading components:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // Get unique categories from components
  const categories = ['all', ...new Set(components.map((c) => c.category))];

  // Filter components
  const filteredComponents = components.filter((component) => {
    const matchesCategory = filterCategory === 'all' || component.category === filterCategory;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && component.isActive) ||
      (filterStatus === 'inactive' && !component.isActive);
    const matchesSearch =
      searchQuery === '' ||
      component.componentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.componentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      component.pluginId.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });

  const handleActivate = async (pluginId: string, componentId: string) => {
    const actionKey = `${pluginId}:${componentId}`;
    setActionInProgress(actionKey);
    try {
      await componentAdminService.activateComponent(pluginId, componentId);
      showSuccess('Component activated successfully');
      await loadComponents();
      triggerRefresh(); // Sync palette with admin changes
    } catch (err) {
      showError('Failed to activate component');
      console.error('Error activating component:', err);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeactivateClick = async (component: ComponentRegistryEntry) => {
    // First check for usage
    try {
      const usage = await componentAdminService.getComponentUsage(
        component.pluginId,
        component.componentId
      );

      if (usage.usageCount > 0) {
        // Show confirmation with affected pages
        setConfirmAction({
          type: 'deactivate',
          pluginId: component.pluginId,
          componentId: component.componentId,
          componentName: component.componentName,
          affectedPages: usage.pages,
        });
        setConfirmModalOpen(true);
      } else {
        // No usage, proceed directly
        await handleDeactivate(component.pluginId, component.componentId);
      }
    } catch (err) {
      showError('Failed to check component usage');
      console.error('Error checking usage:', err);
    }
  };

  const handleDeactivate = async (pluginId: string, componentId: string) => {
    const actionKey = `${pluginId}:${componentId}`;
    setActionInProgress(actionKey);
    setConfirmModalOpen(false);
    try {
      await componentAdminService.deactivateComponent(pluginId, componentId);
      showSuccess('Component deactivated successfully');
      await loadComponents();
      triggerRefresh(); // Sync palette with admin changes
    } catch (err) {
      showError('Failed to deactivate component');
      console.error('Error deactivating component:', err);
    } finally {
      setActionInProgress(null);
      setConfirmAction(null);
    }
  };

  const handleDeleteClick = async (component: ComponentRegistryEntry) => {
    // Check for usage in both backend and localStorage
    try {
      // Search backend for usage
      let backendPages: ExtendedPageUsageInfo[] = [];
      try {
        const usage = await componentAdminService.getComponentUsage(
          component.pluginId,
          component.componentId
        );
        backendPages = (usage.pages || []).map((page) => ({
          ...page,
          source: 'backend' as const,
        }));
      } catch (backendErr) {
        console.warn('Backend usage search failed:', backendErr);
      }

      // Search localStorage for usage
      const localStoragePages = searchLocalStorageForComponentUsage(
        component.pluginId,
        component.componentId
      );

      // Combine results
      const allPages = [...backendPages, ...localStoragePages];

      if (allPages.length > 0) {
        // Cannot delete, show error with affected pages
        setUsageInfo({
          componentId: component.componentId,
          componentName: component.componentName,
          pages: allPages,
          isDeleteBlocked: true, // User tried to delete but blocked
        });
        setUsageModalOpen(true);
      } else {
        // No usage, show confirmation
        setConfirmAction({
          type: 'delete',
          pluginId: component.pluginId,
          componentId: component.componentId,
          componentName: component.componentName,
        });
        setConfirmModalOpen(true);
      }
    } catch (err) {
      showError('Failed to check component usage');
      console.error('Error checking usage:', err);
    }
  };

  const handleDelete = async (pluginId: string, componentId: string) => {
    const actionKey = `${pluginId}:${componentId}`;
    setActionInProgress(actionKey);
    setConfirmModalOpen(false);
    try {
      await componentAdminService.deleteComponent(pluginId, componentId);
      showSuccess('Component deleted successfully');
      await loadComponents();
      triggerRefresh(); // Sync palette with admin changes
    } catch (err) {
      showError('Failed to delete component');
      console.error('Error deleting component:', err);
    } finally {
      setActionInProgress(null);
      setConfirmAction(null);
    }
  };

  const handleViewUsage = async (component: ComponentRegistryEntry) => {
    try {
      // Search backend for usage
      let backendPages: ExtendedPageUsageInfo[] = [];
      try {
        const usage = await componentAdminService.getComponentUsage(
          component.pluginId,
          component.componentId
        );
        backendPages = (usage.pages || []).map((page) => ({
          ...page,
          source: 'backend' as const,
        }));
      } catch (backendErr) {
        console.warn('Backend usage search failed, continuing with localStorage only:', backendErr);
      }

      // Search localStorage for usage
      const localStoragePages = searchLocalStorageForComponentUsage(
        component.pluginId,
        component.componentId
      );

      // Combine results
      const allPages = [...backendPages, ...localStoragePages];

      setUsageInfo({
        componentId: component.componentId,
        componentName: component.componentName,
        pages: allPages,
        isDeleteBlocked: false, // Just viewing usage, not a blocked delete
      });
      setUsageModalOpen(true);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to load component usage';
      showError(message);
      console.error('Error loading usage:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="cm-loading">
        <span className="cm-loading-spinner" />
        Loading components...
      </div>
    );
  }

  return (
    <div className="cm-tab">
      {/* Messages */}
      {error && <div className="cm-error">{error}</div>}
      {successMessage && <div className="cm-success">{successMessage}</div>}

      {/* Toolbar */}
      <ModalSection title="Component Registry">
        <div className="cm-toolbar">
          <div className="cm-filters">
            <input
              type="text"
              className="cm-search-input"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="cm-filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            <select
              className="cm-filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          <div className="cm-actions">
            <ModalButton variant="primary" onClick={() => setUploadModalOpen(true)}>
              Upload Plugin
            </ModalButton>
            <ModalButton variant="secondary" onClick={() => setManifestEditorOpen(true)}>
              Manual Register
            </ModalButton>
          </div>
        </div>

        {/* Stats */}
        <div className="cm-stats">
          <span className="cm-stat">
            <strong>{components.length}</strong> total
          </span>
          <span className="cm-stat">
            <strong>{components.filter((c) => c.isActive).length}</strong> active
          </span>
          <span className="cm-stat">
            <strong>{components.filter((c) => !c.isActive).length}</strong> inactive
          </span>
        </div>
      </ModalSection>

      {/* Component List */}
      <ModalSection title={`Components (${filteredComponents.length})`}>
        {filteredComponents.length === 0 ? (
          <div className="cm-empty-state">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'No components match your filters'
              : 'No components registered'}
          </div>
        ) : (
          <div className="cm-list">
            {filteredComponents.map((component) => {
              const actionKey = `${component.pluginId}:${component.componentId}`;
              const isActionInProgress = actionInProgress === actionKey;

              return (
                <div
                  key={actionKey}
                  className={`cm-item ${!component.isActive ? 'inactive' : ''}`}
                >
                  <div className="cm-icon">{component.icon || '?'}</div>

                  <div className="cm-info">
                    <div className="cm-name">
                      {component.componentName}
                      <span
                        className={`cm-status-badge ${component.isActive ? 'active' : 'inactive'}`}
                      >
                        {component.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="cm-meta">
                      <span className="cm-id">{component.componentId}</span>
                      <span className="cm-plugin">Plugin: {component.pluginId}</span>
                      <span className="cm-category">{component.category}</span>
                    </div>
                  </div>

                  <div className="cm-item-actions">
                    <button
                      className="cm-action-btn view-usage"
                      onClick={() => handleViewUsage(component)}
                      title="View usage"
                    >
                      Usage
                    </button>

                    {component.isActive ? (
                      <button
                        className="cm-action-btn deactivate"
                        onClick={() => handleDeactivateClick(component)}
                        disabled={isActionInProgress}
                        title="Deactivate component"
                      >
                        {isActionInProgress ? '...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button
                        className="cm-action-btn activate"
                        onClick={() => handleActivate(component.pluginId, component.componentId)}
                        disabled={isActionInProgress}
                        title="Activate component"
                      >
                        {isActionInProgress ? '...' : 'Activate'}
                      </button>
                    )}

                    <button
                      className="cm-action-btn delete"
                      onClick={() => handleDeleteClick(component)}
                      disabled={isActionInProgress}
                      title="Delete component"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ModalSection>

      {/* Usage Modal */}
      {usageModalOpen && usageInfo && (
        <div className="cm-modal-overlay" onClick={() => setUsageModalOpen(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>
                {usageInfo.isDeleteBlocked
                  ? `Cannot Delete: ${usageInfo.componentName}`
                  : `Component Usage: ${usageInfo.componentName}`}
              </h3>
              <button className="cm-modal-close" onClick={() => setUsageModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="cm-modal-body">
              {usageInfo.pages.length === 0 ? (
                <p>This component is not used in any pages.</p>
              ) : (
                <>
                  {usageInfo.isDeleteBlocked && (
                    <div className="cm-delete-blocked-warning">
                      <strong>Deletion Blocked:</strong> This component cannot be deleted because it
                      is currently used in {usageInfo.pages.length} page(s). You must remove the
                      component from all pages before it can be deleted.
                    </div>
                  )}
                  <p>
                    This component is used in <strong>{usageInfo.pages.length}</strong> page(s):
                  </p>
                  <ul className="cm-usage-page-list">
                    {usageInfo.pages.map((page, index) => (
                      <li key={`${page.source}-${page.pageId}-${index}`}>
                        <strong>{page.pageName}</strong> ({page.pageSlug})
                        <span className="cm-usage-site-name">in {page.siteName}</span>
                        {page.source === 'localStorage' && (
                          <span className="cm-usage-source-badge local">Local</span>
                        )}
                        {page.source === 'backend' && (
                          <span className="cm-usage-source-badge backend">Server</span>
                        )}
                      </li>
                    ))}
                  </ul>
                  {usageInfo.isDeleteBlocked && (
                    <p className="cm-delete-blocked-hint">
                      Open each page in the builder and remove this component, then try deleting again.
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="cm-modal-footer">
              <ModalButton variant="secondary" onClick={() => setUsageModalOpen(false)}>
                {usageInfo.isDeleteBlocked ? 'Understood' : 'Close'}
              </ModalButton>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && confirmAction && (
        <div className="cm-modal-overlay" onClick={() => setConfirmModalOpen(false)}>
          <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-modal-header">
              <h3>
                Confirm {confirmAction.type === 'delete' ? 'Delete' : 'Deactivate'}
              </h3>
              <button className="cm-modal-close" onClick={() => setConfirmModalOpen(false)}>
                &times;
              </button>
            </div>
            <div className="cm-modal-body">
              <p>
                Are you sure you want to {confirmAction.type}{' '}
                <strong>{confirmAction.componentName}</strong>?
              </p>

              {confirmAction.affectedPages && confirmAction.affectedPages.length > 0 && (
                <div className="cm-confirm-warning">
                  <p>
                    <strong>Warning:</strong> This component is used in{' '}
                    {confirmAction.affectedPages.length} page(s). Deactivating it will prevent
                    editing those pages until the component is removed or reactivated.
                  </p>
                  <ul className="cm-usage-page-list">
                    {confirmAction.affectedPages.slice(0, 5).map((page) => (
                      <li key={page.pageId}>
                        {page.pageName} ({page.siteName})
                      </li>
                    ))}
                    {confirmAction.affectedPages.length > 5 && (
                      <li>...and {confirmAction.affectedPages.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <div className="cm-modal-footer">
              <ModalButton variant="secondary" onClick={() => setConfirmModalOpen(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                variant="danger"
                onClick={() => {
                  if (confirmAction.type === 'delete') {
                    handleDelete(confirmAction.pluginId, confirmAction.componentId);
                  } else {
                    handleDeactivate(confirmAction.pluginId, confirmAction.componentId);
                  }
                }}
              >
                {confirmAction.type === 'delete' ? 'Delete' : 'Deactivate'}
              </ModalButton>
            </div>
          </div>
        </div>
      )}

      {/* Upload Plugin Modal */}
      <ComponentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          loadComponents();
          triggerRefresh(); // Sync palette with new components
          showSuccess('Plugin uploaded successfully');
        }}
      />

      {/* Manual Register Modal */}
      <ManifestEditorModal
        isOpen={manifestEditorOpen}
        onClose={() => setManifestEditorOpen(false)}
        onSuccess={() => {
          loadComponents();
          triggerRefresh(); // Sync palette with new components
          showSuccess('Component registered successfully');
        }}
      />
    </div>
  );
};

export default ComponentManagementTab;
