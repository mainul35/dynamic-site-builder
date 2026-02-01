import React from 'react';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { useBuilderStore } from '../../stores/builderStore';
import {
  BreakpointName,
  BREAKPOINTS,
  BREAKPOINT_ORDER,
  PageLayoutSlot,
  PAGE_LAYOUT_SLOTS,
  BreakpointSettings,
  ResponsiveConfig,
  DEFAULT_RESPONSIVE_CONFIG,
  getBreakpointSettings,
} from '../../types/responsive';
import './ResponsiveSettingsEditor.css';

interface ResponsiveSettingsEditorProps {
  componentId: string;
}

/**
 * ResponsiveSettingsEditor Component
 *
 * Allows users to configure per-breakpoint settings for PageLayout:
 * - Slot visibility (show/hide each slot)
 * - Stack sidebars toggle
 * - Sidebar ratio override
 */
export const ResponsiveSettingsEditor: React.FC<ResponsiveSettingsEditorProps> = ({
  componentId,
}) => {
  const activeBreakpoint = useUIPreferencesStore((state) => state.activeBreakpoint);
  const setActiveBreakpoint = useUIPreferencesStore((state) => state.setActiveBreakpoint);
  const { findComponent, updateComponentProps } = useBuilderStore();

  const component = findComponent(componentId);

  if (!component || component.componentId !== 'PageLayout') {
    return null;
  }

  // Get current responsive config from component props
  const responsiveConfig: ResponsiveConfig = component.props?.responsive || DEFAULT_RESPONSIVE_CONFIG;
  const currentSettings = getBreakpointSettings(responsiveConfig, activeBreakpoint);

  // Update settings for the active breakpoint
  const updateBreakpointSettings = (updates: Partial<BreakpointSettings>) => {
    const newSettings: BreakpointSettings = {
      ...currentSettings,
      ...updates,
    };

    const newResponsiveConfig: ResponsiveConfig = {
      ...responsiveConfig,
      [activeBreakpoint]: newSettings,
    };

    updateComponentProps(componentId, {
      ...component.props,
      responsive: newResponsiveConfig,
    });
  };

  // Toggle slot visibility
  const toggleSlotVisibility = (slot: PageLayoutSlot) => {
    const newVisibility = {
      ...currentSettings.slotVisibility,
      [slot]: !currentSettings.slotVisibility[slot],
    };
    updateBreakpointSettings({ slotVisibility: newVisibility });
  };

  // Toggle stack sidebars
  const toggleStackSidebars = () => {
    updateBreakpointSettings({ stackSidebars: !currentSettings.stackSidebars });
  };

  // Update sidebar ratio
  const updateSidebarRatio = (ratio: string) => {
    updateBreakpointSettings({ sidebarRatio: ratio });
  };

  const slotLabels: Record<PageLayoutSlot, string> = {
    header: 'Header',
    footer: 'Footer',
    left: 'Left Panel',
    right: 'Right Panel',
    center: 'Center Content',
  };

  const sidebarRatios = ['20-80', '25-75', '30-70', '35-65', '40-60'];

  return (
    <div className="responsive-settings-editor">
      <div className="responsive-settings-header">
        <h4>Responsive Settings</h4>
        <p className="responsive-settings-description">
          Configure layout for different screen sizes
        </p>
      </div>

      {/* Breakpoint Selector */}
      <div className="responsive-breakpoint-selector">
        <label>Editing breakpoint:</label>
        <div className="breakpoint-buttons">
          {BREAKPOINT_ORDER.map((bp) => {
            const def = BREAKPOINTS[bp];
            return (
              <button
                key={bp}
                className={`breakpoint-btn ${activeBreakpoint === bp ? 'active' : ''}`}
                onClick={() => setActiveBreakpoint(bp)}
                title={`${def.label} (${def.canvasWidth}px)`}
              >
                <span className="bp-icon">{def.icon}</span>
                <span className="bp-label">{def.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Breakpoint Info */}
      <div className="breakpoint-info">
        <span className="breakpoint-info-icon">{BREAKPOINTS[activeBreakpoint].icon}</span>
        <span className="breakpoint-info-text">
          {BREAKPOINTS[activeBreakpoint].label}
          {BREAKPOINTS[activeBreakpoint].maxWidth ? (
            <span className="breakpoint-range">
              ({BREAKPOINTS[activeBreakpoint].minWidth}px - {BREAKPOINTS[activeBreakpoint].maxWidth}px)
            </span>
          ) : (
            <span className="breakpoint-range">
              ({BREAKPOINTS[activeBreakpoint].minWidth}px+)
            </span>
          )}
        </span>
      </div>

      {/* Slot Visibility */}
      <div className="responsive-section">
        <h5>Slot Visibility</h5>
        <p className="section-description">Show or hide layout regions on {BREAKPOINTS[activeBreakpoint].label}</p>
        <div className="slot-visibility-grid">
          {PAGE_LAYOUT_SLOTS.map((slot) => (
            <label key={slot} className="slot-checkbox">
              <input
                type="checkbox"
                checked={currentSettings.slotVisibility[slot]}
                onChange={() => toggleSlotVisibility(slot)}
              />
              <span className="slot-label">{slotLabels[slot]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Stack Sidebars */}
      <div className="responsive-section">
        <h5>Layout Mode</h5>
        <label className="stack-sidebars-toggle">
          <input
            type="checkbox"
            checked={currentSettings.stackSidebars || false}
            onChange={toggleStackSidebars}
          />
          <span className="toggle-label">Stack slots vertically</span>
        </label>
        <p className="section-description">
          {currentSettings.stackSidebars
            ? 'Slots arranged in a single column'
            : 'Sidebars positioned next to content'}
        </p>
      </div>

      {/* Sidebar Ratio (only when not stacking) */}
      {!currentSettings.stackSidebars && (
        <div className="responsive-section">
          <h5>Sidebar Width</h5>
          <select
            className="sidebar-ratio-select"
            value={currentSettings.sidebarRatio || '30-70'}
            onChange={(e) => updateSidebarRatio(e.target.value)}
          >
            {sidebarRatios.map((ratio) => {
              const [left, center] = ratio.split('-');
              return (
                <option key={ratio} value={ratio}>
                  Left {left}% / Center {center}%
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* Quick Apply Section */}
      <div className="responsive-section quick-apply">
        <h5>Quick Presets</h5>
        <div className="preset-buttons">
          <button
            className="preset-btn"
            onClick={() => {
              updateBreakpointSettings({
                slotVisibility: { header: true, footer: true, left: false, right: false, center: true },
                stackSidebars: true,
              });
            }}
            title="Hide sidebars and stack vertically"
          >
            Mobile Friendly
          </button>
          <button
            className="preset-btn"
            onClick={() => {
              updateBreakpointSettings({
                slotVisibility: { header: true, footer: true, left: true, right: true, center: true },
                stackSidebars: false,
              });
            }}
            title="Show all slots side by side"
          >
            Full Desktop
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveSettingsEditor;
