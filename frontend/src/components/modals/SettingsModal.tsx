import React, { useState } from 'react';
import { ModalBase, ModalSection, ModalActions, ModalButton } from './ModalBase';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useAuthStore } from '../../stores/authStore';
import { PublicApiPatternsSection } from '../admin/PublicApiPatternsSection';
import { ComponentManagementTab } from '../settings/ComponentManagementTab';
import './SettingsModal.css';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'editor' | 'keyboard' | 'security' | 'components';

/**
 * SettingsModal - Application settings modal
 */
export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const uiPreferences = useUIPreferencesStore();
  const { isAdmin } = useAuthStore();

  // Build tabs list - Security and Components tabs only visible to admins
  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'general', label: 'General' },
    { id: 'editor', label: 'Editor' },
    { id: 'keyboard', label: 'Shortcuts' },
    ...(isAdmin() ? [
      { id: 'security' as SettingsTab, label: 'Security' },
      { id: 'components' as SettingsTab, label: 'Components' },
    ] : []),
  ];

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={onClose}>
        Close
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Settings" size="large" footer={footer}>
      <div className="settings-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-content">
        {activeTab === 'general' && (
          <div className="settings-panel">
            <ModalSection title="Appearance">
              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Dark Mode</span>
                  <span className="settings-toggle-desc">Use dark color scheme</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.darkMode ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleDarkMode()}
                  aria-label="Toggle dark mode"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Compact Mode</span>
                  <span className="settings-toggle-desc">Reduce spacing in UI elements</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.compactMode ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleCompactMode()}
                  aria-label="Toggle compact mode"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>
            </ModalSection>

            <ModalSection title="Notifications">
              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Auto-save Notifications</span>
                  <span className="settings-toggle-desc">Show notification when page auto-saves</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.autoSaveNotifications ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleAutoSaveNotifications()}
                  aria-label="Toggle auto-save notifications"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>
            </ModalSection>
          </div>
        )}

        {activeTab === 'editor' && (
          <div className="settings-panel">
            <ModalSection title="Canvas">
              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Show Grid</span>
                  <span className="settings-toggle-desc">Display grid overlay on canvas</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.showGrid ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleGrid()}
                  aria-label="Toggle grid"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Show Rulers</span>
                  <span className="settings-toggle-desc">Display rulers on canvas edges</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.showRulers ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleRulers()}
                  aria-label="Toggle rulers"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>

              <div className="settings-toggle">
                <div className="settings-toggle-info">
                  <span className="settings-toggle-label">Component Outlines</span>
                  <span className="settings-toggle-desc">Show borders around components</span>
                </div>
                <button
                  className={`settings-switch ${uiPreferences.showComponentOutlines ? 'active' : ''}`}
                  onClick={() => uiPreferences.toggleComponentOutlines()}
                  aria-label="Toggle component outlines"
                >
                  <span className="settings-switch-knob" />
                </button>
              </div>
            </ModalSection>

            <ModalSection title="Zoom">
              <div className="settings-zoom">
                <span className="settings-zoom-label">Default Zoom Level</span>
                <div className="settings-zoom-buttons">
                  {uiPreferences.zoomLevels.map((level) => (
                    <button
                      key={level}
                      className={`settings-zoom-btn ${uiPreferences.zoomLevel === level ? 'active' : ''}`}
                      onClick={() => uiPreferences.setZoomLevel(level)}
                    >
                      {level}%
                    </button>
                  ))}
                </div>
              </div>
            </ModalSection>
          </div>
        )}

        {activeTab === 'keyboard' && (
          <div className="settings-panel">
            <ModalSection title="Editor Shortcuts">
              <div className="settings-shortcuts">
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Save Page</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>S</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Undo</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>Z</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Redo</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Copy</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>C</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Cut</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>X</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Paste</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>V</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Delete</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Delete</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">CSS Editor</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>E</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Preview Mode</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>P</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Select All</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>A</kbd>
                  </span>
                </div>
              </div>
            </ModalSection>

            <ModalSection title="Navigation Shortcuts">
              <div className="settings-shortcuts">
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Zoom In</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>+</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Zoom Out</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>-</kbd>
                  </span>
                </div>
                <div className="settings-shortcut">
                  <span className="settings-shortcut-action">Reset Zoom</span>
                  <span className="settings-shortcut-keys">
                    <kbd>Ctrl</kbd> + <kbd>0</kbd>
                  </span>
                </div>
              </div>
            </ModalSection>
          </div>
        )}

        {activeTab === 'security' && isAdmin() && (
          <div className="settings-panel">
            <PublicApiPatternsSection />
          </div>
        )}

        {activeTab === 'components' && isAdmin() && (
          <div className="settings-panel">
            <ComponentManagementTab />
          </div>
        )}
      </div>
    </ModalBase>
  );
};

export default SettingsModal;
