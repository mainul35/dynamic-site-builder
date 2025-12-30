import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menubar, Menu, MenuItem, MenuDivider, SubMenu, MenubarSpacer, MenubarButton } from '../menubar';
import { ProfileModal, SettingsModal, SiteSettingsModal, PageSettingsModal, NewSiteModal, NewPageModal } from '../modals';
import { useBuilderStore } from '../../stores/builderStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useSiteManagerStore } from '../../stores/siteManagerStore';
import { useClipboardStore } from '../../stores/clipboardStore';
import { Page } from '../../types/site';
import './BuilderMenubar.css';

export interface BuilderMenubarProps {
  siteId: number | null;
  pageId: number | null;
  currentPageMeta: Page | null;
  saveStatus: 'saved' | 'unsaved' | 'saving' | 'error';
  onSave: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onExport: () => void;
  onImport: (pageDefinition: any) => void;
  onShowCSSEditor: () => void;
  onPageSelect: (page: Page) => void;
  onPageCreate: (page: Page) => void;
  onShowImageRepository: () => void;
}

export const BuilderMenubar: React.FC<BuilderMenubarProps> = ({
  siteId,
  currentPageMeta,
  saveStatus,
  onSave,
  onPublish,
  onPreview,
  onExport,
  onImport,
  onShowCSSEditor,
  onPageSelect,
  onShowImageRepository,
}) => {
  const navigate = useNavigate();
  const builderStore = useBuilderStore();
  const authStore = useAuthStore();
  const uiPreferences = useUIPreferencesStore();
  const siteManager = useSiteManagerStore();
  const clipboardStore = useClipboardStore();

  // Modal states
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSiteSettingsModal, setShowSiteSettingsModal] = useState(false);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);
  const [showNewSiteModal, setShowNewSiteModal] = useState(false);
  const [showNewPageModal, setShowNewPageModal] = useState(false);

  const { currentPage, selectedComponentId, undo, redo, canUndo, canRedo, deleteComponent, selectComponent } = builderStore;
  const { user, logout } = authStore;
  const sites = siteManager.sites || [];
  const currentSiteId = siteManager.currentSiteId;
  const pageTree = siteManager.pageTree || [];
  const { selectSite, loadSites, isLoadingSites } = siteManager;

  // Load sites on mount if not already loaded
  useEffect(() => {
    if (sites.length === 0 && !isLoadingSites) {
      console.log('[BuilderMenubar] Loading sites on mount');
      loadSites();
    }
  }, [sites.length, isLoadingSites, loadSites]);

  // Handlers
  const handleCopy = () => {
    if (!currentPage?.rootComponent || !selectedComponentId) return;
    const components = currentPage.rootComponent ? [currentPage.rootComponent] : [];
    clipboardStore.copy(components, [selectedComponentId]);
  };

  const handleCut = () => {
    if (!currentPage?.rootComponent || !selectedComponentId) return;
    const components = currentPage.rootComponent ? [currentPage.rootComponent] : [];
    clipboardStore.cut(components, [selectedComponentId]);
  };

  const handlePaste = () => {
    const pastedComponents = clipboardStore.paste();
    if (pastedComponents) {
      console.log('Pasted:', pastedComponents);
      // TODO: Add to builder tree
    }
  };

  const handleDelete = () => {
    if (selectedComponentId) {
      deleteComponent(selectedComponentId);
    }
  };

  const handleSelectAll = () => {
    // TODO: Implement multi-select
    console.log('Select all');
  };

  const handleDeselect = () => {
    selectComponent(null);
  };

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const handleSiteSelect = async (siteIdToSelect: number) => {
    await selectSite(siteIdToSelect);
    // Navigate to first page of site
    const firstPage = pageTree[0];
    if (firstPage) {
      onPageSelect(firstPage.page);
    }
  };

  const handleZoom = (level: number) => {
    uiPreferences.setZoomLevel(level);
  };

  // Handle import from JSON file
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const pageDefinition = JSON.parse(text);

        // Validate basic structure
        if (!pageDefinition.version || !pageDefinition.pageName) {
          alert('Invalid page definition file. Missing required fields.');
          return;
        }

        onImport(pageDefinition);
      } catch (err) {
        alert('Failed to import file. Please ensure it is a valid JSON file.');
        console.error('Import error:', err);
      }
    };
    input.click();
  };

  const getInitials = (name?: string): string => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Menubar className="builder-menubar">
        {/* Brand/Logo */}
        <div className="menubar-brand">
          <span className="brand-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 3h14a2 2 0 012 2v10a2 2 0 01-2 2H3a2 2 0 01-2-2V5a2 2 0 012-2zm0 2v10h14V5H3z" />
              <path d="M5 7h2v2H5V7zm0 4h10v2H5v-2zm4-4h6v2H9V7z" />
            </svg>
          </span>
          <span className="brand-text">Site Builder</span>
        </div>

        {/* File Menu */}
        <Menu label="File">
          <MenuItem label="Save" shortcut="Ctrl+S" onClick={onSave} disabled={saveStatus === 'saving'} />
          <MenuItem label="Save As..." onClick={() => console.log('Save As')} />
          <MenuDivider />
          <SubMenu label="Export">
            <MenuItem label="HTML" onClick={() => onExport()} />
            <MenuItem label="JSON" onClick={() => {
              if (currentPage) {
                const dataStr = JSON.stringify(currentPage, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${currentPage.pageName}.json`;
                a.click();
              }
            }} />
            <MenuItem label="Full Site Package" onClick={onExport} />
          </SubMenu>
          <MenuItem label="Import..." onClick={handleImport} />
          <MenuDivider />
          <MenuItem label="Page Settings..." onClick={() => setShowPageSettingsModal(true)} disabled={!currentPageMeta} />
          <MenuItem label="Close Page" onClick={() => navigate('/dashboard')} />
        </Menu>

        {/* Edit Menu */}
        <Menu label="Edit">
          <MenuItem label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={!canUndo()} />
          <MenuItem label="Redo" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={!canRedo()} />
          <MenuDivider />
          <MenuItem label="Cut" shortcut="Ctrl+X" onClick={handleCut} disabled={!selectedComponentId} />
          <MenuItem label="Copy" shortcut="Ctrl+C" onClick={handleCopy} disabled={!selectedComponentId} />
          <MenuItem label="Paste" shortcut="Ctrl+V" onClick={handlePaste} disabled={!clipboardStore.canPaste()} />
          <MenuItem label="Delete" shortcut="Del" onClick={handleDelete} disabled={!selectedComponentId} danger />
          <MenuDivider />
          <MenuItem label="Select All" shortcut="Ctrl+A" onClick={handleSelectAll} />
          <MenuItem label="Deselect" onClick={handleDeselect} disabled={!selectedComponentId} />
          <MenuDivider />
          <MenuItem label="CSS Editor" shortcut="Ctrl+E" onClick={onShowCSSEditor} disabled={!selectedComponentId} />
          <MenuItem label="Global Styles..." onClick={() => console.log('Global Styles')} />
        </Menu>

        {/* View Menu */}
        <Menu label="View">
          <MenuItem label="Preview Mode" onClick={onPreview} />
          <MenuItem label="Edit Mode" onClick={() => builderStore.setViewMode('edit')} />
          <MenuDivider />
          <MenuItem
            label="Show Grid"
            onClick={() => uiPreferences.toggleGrid()}
            isToggle
            isToggled={uiPreferences.showGrid}
          />
          <MenuItem
            label="Show Rulers"
            onClick={() => uiPreferences.toggleRulers()}
            isToggle
            isToggled={uiPreferences.showRulers}
          />
          <MenuItem
            label="Show Component Outlines"
            onClick={() => uiPreferences.toggleComponentOutlines()}
            isToggle
            isToggled={uiPreferences.showComponentOutlines}
          />
          <MenuDivider />
          <SubMenu label="Zoom">
            {(uiPreferences.zoomLevels || [25, 50, 75, 100, 125, 150, 200]).map((level) => (
              <MenuItem
                key={level}
                label={`${level}%`}
                onClick={() => handleZoom(level)}
                isToggle
                isToggled={uiPreferences.zoomLevel === level}
              />
            ))}
          </SubMenu>
          <MenuDivider />
          <MenuItem
            label="Components Panel"
            onClick={() => uiPreferences.toggleLeftPanel()}
            isToggle
            isToggled={!uiPreferences.leftPanelCollapsed}
          />
          <MenuItem
            label="Properties Panel"
            onClick={() => uiPreferences.toggleRightPanel()}
            isToggle
            isToggled={!uiPreferences.rightPanelCollapsed}
          />
        </Menu>

        {/* Site Menu */}
        <Menu label="Site">
          <SubMenu label="Select Site">
            {sites.length > 0 ? (
              sites.map((site) => (
                <MenuItem
                  key={site.id}
                  label={site.siteName}
                  onClick={() => handleSiteSelect(site.id)}
                  isToggle
                  isToggled={currentSiteId === site.id}
                />
              ))
            ) : (
              <MenuItem label="No sites available" disabled />
            )}
          </SubMenu>
          <MenuItem label="New Site..." onClick={() => setShowNewSiteModal(true)} />
          <MenuItem label="Site Settings..." onClick={() => setShowSiteSettingsModal(true)} disabled={!currentSiteId} />
          <MenuDivider />
          <SubMenu label="Pages">
            {pageTree.length > 0 ? (
              <>
                {pageTree.map((node) => (
                  <MenuItem
                    key={node.page.id}
                    label={node.page.pageName}
                    onClick={() => onPageSelect(node.page)}
                    isToggle
                    isToggled={currentPageMeta?.id === node.page.id}
                  />
                ))}
                <MenuDivider />
                <MenuItem label="Manage Pages..." onClick={() => console.log('Manage pages')} />
              </>
            ) : (
              <MenuItem label="No pages" disabled />
            )}
          </SubMenu>
          <MenuItem label="New Page..." onClick={() => setShowNewPageModal(true)} />
          <MenuDivider />
          <MenuItem label="Layouts..." onClick={() => console.log('Layouts')} />
          <MenuItem label="Global Styles..." onClick={() => console.log('Global Styles')} />
        </Menu>

        {/* Content Menu */}
        <Menu label="Content">
          <MenuItem label="Content Repository" onClick={onShowImageRepository} />
          <MenuItem label="Upload Content..." onClick={() => console.log('Upload')} />
          <MenuDivider />
          <MenuItem label="Images" onClick={onShowImageRepository} />
          <MenuItem label="Videos" onClick={() => console.log('Videos')} />
          <MenuItem label="Documents" onClick={() => console.log('Documents')} />
          <MenuDivider />
          <MenuItem label="Manage Folders..." onClick={() => console.log('Manage folders')} />
        </Menu>

        <MenubarSpacer />

        {/* Save status indicator */}
        <div className="menubar-status">
          <span className={`status-dot status-${saveStatus}`} />
          <span className="status-text">
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'unsaved' && 'Unsaved'}
            {saveStatus === 'saving' && 'Saving...'}
            {saveStatus === 'error' && 'Error'}
          </span>
        </div>

        {/* User Menu */}
        <Menu
          id="user-menu"
          label={
            <div className="user-menu-trigger">
              <div className="user-avatar">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName || user.username} />
                ) : (
                  <span>{getInitials(user?.fullName || user?.username)}</span>
                )}
              </div>
              <span className="user-name">{user?.fullName || user?.username || 'Guest'}</span>
            </div>
          }
          align="right"
        >
          <div className="user-menu-header">
            <div className="user-menu-avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || user.username} />
              ) : (
                <span>{getInitials(user?.fullName || user?.username)}</span>
              )}
            </div>
            <div className="user-menu-info">
              <span className="user-menu-name">{user?.fullName || user?.username}</span>
              <span className="user-menu-email">{user?.email}</span>
            </div>
          </div>
          <MenuDivider />
          <MenuItem label="Profile" onClick={() => setShowProfileModal(true)} />
          <MenuItem label="Settings" onClick={() => setShowSettingsModal(true)} />
          <MenuItem label="Change Password" onClick={() => console.log('Change password')} />
          <MenuDivider />
          <MenuItem label="Sign Out" onClick={handleLogout} danger />
        </Menu>

        {/* Publish Button */}
        <MenubarButton variant="primary" onClick={onPublish} title="Publish site">
          Publish
        </MenubarButton>
      </Menubar>

      {/* Modals */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
      <SiteSettingsModal isOpen={showSiteSettingsModal} onClose={() => setShowSiteSettingsModal(false)} />
      <PageSettingsModal
        isOpen={showPageSettingsModal}
        onClose={() => setShowPageSettingsModal(false)}
        page={currentPageMeta}
        onSave={async (pageId, updates) => {
          await siteManager.updatePage(pageId, updates);
        }}
      />
      <NewSiteModal
        isOpen={showNewSiteModal}
        onClose={() => setShowNewSiteModal(false)}
        onSuccess={(newSiteId) => {
          selectSite(newSiteId);
        }}
      />
      <NewPageModal
        isOpen={showNewPageModal}
        onClose={() => setShowNewPageModal(false)}
        onSuccess={(newPageId) => {
          const newPage = pageTree.find((n) => n.page.id === newPageId)?.page;
          if (newPage) onPageSelect(newPage);
        }}
      />
    </>
  );
};

export default BuilderMenubar;
