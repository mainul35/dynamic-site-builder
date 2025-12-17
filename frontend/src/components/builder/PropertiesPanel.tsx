import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { ComponentManifest, PropDefinition, PropType } from '../../types/builder';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedComponentId: string | null;
}

/**
 * PropertiesPanel - Right sidebar for editing component properties and styles
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedComponentId }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'styles' | 'layout'>('props');
  const [manifest, setManifest] = useState<ComponentManifest | null>(null);

  const {
    currentPage,
    updateComponentProps,
    updateComponentStyles,
    moveComponent,
    resizeComponent,
    removeComponent,
    duplicateComponent,
    findComponent
  } = useBuilderStore();

  const { getManifest } = useComponentStore();

  const selectedComponent = selectedComponentId ? findComponent(selectedComponentId) : null;

  // Load component manifest when selection changes
  useEffect(() => {
    if (selectedComponent) {
      console.log('Loading manifest for:', selectedComponent.pluginId, selectedComponent.componentId);
      const m = getManifest(selectedComponent.pluginId, selectedComponent.componentId);
      console.log('Manifest loaded:', m);

      // If manifest not in cache, try to parse from component itself
      if (!m && selectedComponent.pluginId && selectedComponent.componentId) {
        console.log('Manifest not in cache, will fetch from API');
        // Try to get from component registry
        import('../../services/componentService').then(({ componentService }) => {
          componentService.getComponentManifest(selectedComponent.pluginId, selectedComponent.componentId)
            .then(manifest => {
              console.log('Fetched manifest from API:', manifest);
              setManifest(manifest);
            })
            .catch(err => console.error('Failed to fetch manifest:', err));
        });
      } else {
        setManifest(m);
      }
    } else {
      setManifest(null);
    }
  }, [selectedComponent]);

  if (!selectedComponent) {
    return (
      <div className="properties-panel">
        <div className="properties-header">
          <h3>Properties</h3>
        </div>
        <div className="empty-properties-state">
          <div className="empty-icon">🎯</div>
          <p>Select a component to edit its properties</p>
        </div>
      </div>
    );
  }

  const handlePropChange = (propName: string, value: any) => {
    updateComponentProps(selectedComponent.instanceId, {
      ...selectedComponent.props,
      [propName]: value
    });
  };

  const handleStyleChange = (styleName: string, value: string) => {
    updateComponentStyles(selectedComponent.instanceId, {
      ...selectedComponent.styles,
      [styleName]: value
    });
  };

  const handlePositionChange = (field: 'row' | 'column' | 'rowSpan' | 'columnSpan', value: number) => {
    moveComponent(selectedComponent.instanceId, {
      ...selectedComponent.position,
      [field]: value
    });
  };

  const handleSizeChange = (field: 'width' | 'height', value: string) => {
    resizeComponent(selectedComponent.instanceId, {
      ...selectedComponent.size,
      [field]: value
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this component?')) {
      removeComponent(selectedComponent.instanceId);
    }
  };

  const handleDuplicate = () => {
    duplicateComponent(selectedComponent.instanceId);
  };

  const renderPropInput = (propDef: PropDefinition) => {
    const value = selectedComponent.props[propDef.name] ?? propDef.defaultValue;

    switch (propDef.type) {
      case PropType.STRING:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, e.target.value)}
            placeholder={propDef.helpText}
          />
        );

      case PropType.NUMBER:
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, parseFloat(e.target.value))}
            min={propDef.min}
            max={propDef.max}
            step={propDef.step || 1}
            placeholder={propDef.helpText}
          />
        );

      case PropType.BOOLEAN:
        return (
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handlePropChange(propDef.name, e.target.checked)}
            />
            <span>{propDef.label}</span>
          </label>
        );

      case PropType.SELECT:
        return (
          <select
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, e.target.value)}
          >
            <option value="">Select {propDef.label}</option>
            {propDef.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case PropType.COLOR:
        return (
          <div className="color-input-group">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handlePropChange(propDef.name, e.target.value)}
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handlePropChange(propDef.name, e.target.value)}
              placeholder="#000000"
            />
          </div>
        );

      case PropType.TEXTAREA:
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, e.target.value)}
            placeholder={propDef.helpText}
            rows={4}
          />
        );

      case PropType.URL:
      case PropType.IMAGE:
        return (
          <input
            type="url"
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, e.target.value)}
            placeholder={propDef.helpText || 'https://example.com'}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handlePropChange(propDef.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="properties-panel">
      {/* Header */}
      <div className="properties-header">
        <h3>Properties</h3>
        <div className="component-actions">
          <button onClick={handleDuplicate} className="action-button" title="Duplicate">
            📋
          </button>
          <button onClick={handleDelete} className="action-button delete" title="Delete">
            🗑️
          </button>
        </div>
      </div>

      {/* Component Info */}
      <div className="component-info-section">
        <div className="component-name-display">{selectedComponent.componentId}</div>
        <div className="component-id-display">{selectedComponent.instanceId}</div>
      </div>

      {/* Tabs */}
      <div className="properties-tabs">
        <button
          className={`tab ${activeTab === 'props' ? 'active' : ''}`}
          onClick={() => setActiveTab('props')}
        >
          Props
        </button>
        <button
          className={`tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Styles
        </button>
        <button
          className={`tab ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          Layout
        </button>
      </div>

      {/* Tab Content */}
      <div className="properties-content">
        {/* Props Tab */}
        {activeTab === 'props' && (
          <div className="props-section">
            {manifest?.configurableProps && manifest.configurableProps.length > 0 ? (
              manifest.configurableProps.map(propDef => (
                <div key={propDef.name} className="property-field">
                  <label className="property-label">
                    {propDef.label}
                    {propDef.required && <span className="required">*</span>}
                  </label>
                  {renderPropInput(propDef)}
                  {propDef.helpText && (
                    <small className="help-text">{propDef.helpText}</small>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-section">
                <p>No configurable properties</p>
              </div>
            )}
          </div>
        )}

        {/* Styles Tab */}
        {activeTab === 'styles' && (
          <div className="styles-section">
            {/* Common style properties */}
            <div className="property-field">
              <label className="property-label">Background Color</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={selectedComponent.styles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                />
                <input
                  type="text"
                  value={selectedComponent.styles.backgroundColor || ''}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div className="property-field">
              <label className="property-label">Text Color</label>
              <div className="color-input-group">
                <input
                  type="color"
                  value={selectedComponent.styles.color || '#000000'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                />
                <input
                  type="text"
                  value={selectedComponent.styles.color || ''}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="property-field">
              <label className="property-label">Font Size</label>
              <input
                type="text"
                value={selectedComponent.styles.fontSize || ''}
                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                placeholder="16px"
              />
            </div>

            <div className="property-field">
              <label className="property-label">Padding</label>
              <input
                type="text"
                value={selectedComponent.styles.padding || ''}
                onChange={(e) => handleStyleChange('padding', e.target.value)}
                placeholder="10px"
              />
            </div>

            <div className="property-field">
              <label className="property-label">Border</label>
              <input
                type="text"
                value={selectedComponent.styles.border || ''}
                onChange={(e) => handleStyleChange('border', e.target.value)}
                placeholder="1px solid #ccc"
              />
            </div>

            <div className="property-field">
              <label className="property-label">Border Radius</label>
              <input
                type="text"
                value={selectedComponent.styles.borderRadius || ''}
                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                placeholder="4px"
              />
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="layout-section">
            <div className="section-title">Position</div>
            <div className="layout-grid">
              <div className="property-field">
                <label className="property-label">Row</label>
                <input
                  type="number"
                  value={selectedComponent.position.row}
                  onChange={(e) => handlePositionChange('row', parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div className="property-field">
                <label className="property-label">Column</label>
                <input
                  type="number"
                  value={selectedComponent.position.column}
                  onChange={(e) => handlePositionChange('column', parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div className="property-field">
                <label className="property-label">Row Span</label>
                <input
                  type="number"
                  value={selectedComponent.position.rowSpan}
                  onChange={(e) => handlePositionChange('rowSpan', parseInt(e.target.value))}
                  min={1}
                />
              </div>
              <div className="property-field">
                <label className="property-label">Column Span</label>
                <input
                  type="number"
                  value={selectedComponent.position.columnSpan}
                  onChange={(e) => handlePositionChange('columnSpan', parseInt(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            <div className="section-title">Size</div>
            <div className="property-field">
              <label className="property-label">Width</label>
              <input
                type="text"
                value={selectedComponent.size.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                placeholder="auto"
              />
            </div>
            <div className="property-field">
              <label className="property-label">Height</label>
              <input
                type="text"
                value={selectedComponent.size.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                placeholder="auto"
              />
            </div>

            <div className="section-title">Z-Index</div>
            <div className="property-field">
              <label className="property-label">Layer Order</label>
              <input
                type="number"
                value={selectedComponent.zIndex || 1}
                onChange={(e) => handleStyleChange('zIndex', e.target.value)}
                min={0}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
