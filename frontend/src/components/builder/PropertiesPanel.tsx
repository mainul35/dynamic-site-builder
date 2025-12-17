import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { ComponentManifest, PropDefinition, PropType, ComponentEventConfig, ActionType } from '../../types/builder';
import './PropertiesPanel.css';

/** Available UI event types */
const UI_EVENT_TYPES = [
  { value: 'onClick', label: 'On Click' },
  { value: 'onDoubleClick', label: 'On Double Click' },
  { value: 'onMouseEnter', label: 'On Mouse Enter' },
  { value: 'onMouseLeave', label: 'On Mouse Leave' },
  { value: 'onFocus', label: 'On Focus' },
  { value: 'onBlur', label: 'On Blur' },
  { value: 'onChange', label: 'On Change' },
  { value: 'onSubmit', label: 'On Submit' },
];

/** Action type options with labels and required config fields */
const ACTION_TYPE_OPTIONS: { value: ActionType; label: string; configFields: string[] }[] = [
  { value: ActionType.NONE, label: 'No Action', configFields: [] },
  { value: ActionType.NAVIGATE, label: 'Navigate to URL', configFields: ['url'] },
  { value: ActionType.SHOW_MESSAGE, label: 'Show Message', configFields: ['message', 'type'] },
  { value: ActionType.TOGGLE_VISIBILITY, label: 'Toggle Visibility', configFields: ['targetComponentId'] },
  { value: ActionType.UPDATE_PROP, label: 'Update Property', configFields: ['targetComponentId', 'propName', 'value'] },
  { value: ActionType.SUBMIT_FORM, label: 'Submit Form', configFields: ['formId'] },
  { value: ActionType.OPEN_MODAL, label: 'Open Modal', configFields: ['modalId'] },
  { value: ActionType.CLOSE_MODAL, label: 'Close Modal', configFields: ['modalId'] },
  { value: ActionType.CALL_API, label: 'Call Backend API', configFields: ['endpoint', 'method'] },
  { value: ActionType.EMIT_EVENT, label: 'Emit Custom Event', configFields: ['eventName', 'eventData'] },
  { value: ActionType.CUSTOM_CODE, label: 'Custom Code', configFields: ['code'] },
];

interface PropertiesPanelProps {
  selectedComponentId: string | null;
}

/**
 * PropertiesPanel - Right sidebar for editing component properties and styles
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedComponentId }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'styles' | 'layout' | 'events'>('props');
  const [manifest, setManifest] = useState<ComponentManifest | null>(null);

  const {
    updateComponent,
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

  // Event handlers for Events tab
  const handleAddEvent = (eventType: string) => {
    const existingEvents = selectedComponent.events || [];
    // Check if event type already exists
    if (existingEvents.some(e => e.eventType === eventType)) {
      return;
    }
    const newEvent: ComponentEventConfig = {
      eventType,
      action: { type: ActionType.NONE, config: {} },
      preventDefault: false,
      stopPropagation: false,
      previewOnly: true,
    };
    updateComponent(selectedComponent.instanceId, {
      events: [...existingEvents, newEvent]
    });
  };

  const handleRemoveEvent = (eventType: string) => {
    const existingEvents = selectedComponent.events || [];
    updateComponent(selectedComponent.instanceId, {
      events: existingEvents.filter(e => e.eventType !== eventType)
    });
  };

  const handleEventConfigChange = (eventType: string, updates: Partial<ComponentEventConfig>) => {
    const existingEvents = selectedComponent.events || [];
    const updatedEvents = existingEvents.map(e =>
      e.eventType === eventType ? { ...e, ...updates } : e
    );
    updateComponent(selectedComponent.instanceId, { events: updatedEvents });
  };

  const handleActionTypeChange = (eventType: string, actionType: ActionType) => {
    handleEventConfigChange(eventType, {
      action: { type: actionType, config: {} },
      customCode: actionType === ActionType.CUSTOM_CODE ? '' : undefined,
    });
  };

  const handleActionConfigChange = (eventType: string, configKey: string, value: any) => {
    const existingEvents = selectedComponent.events || [];
    const currentEvent = existingEvents.find(e => e.eventType === eventType);
    if (!currentEvent?.action) return;

    handleEventConfigChange(eventType, {
      action: {
        ...currentEvent.action,
        config: { ...currentEvent.action.config, [configKey]: value }
      }
    });
  };

  const renderActionConfigFields = (event: ComponentEventConfig) => {
    if (!event.action || event.action.type === ActionType.NONE) return null;

    const actionOption = ACTION_TYPE_OPTIONS.find(a => a.value === event.action?.type);
    if (!actionOption) return null;

    return (
      <div className="action-config-fields">
        {actionOption.configFields.map(field => (
          <div key={field} className="property-field">
            <label className="property-label">{field}</label>
            {field === 'code' ? (
              <textarea
                value={event.action?.config[field] || ''}
                onChange={(e) => handleActionConfigChange(event.eventType, field, e.target.value)}
                placeholder="Enter JavaScript code..."
                rows={4}
                className="code-editor"
              />
            ) : field === 'type' ? (
              <select
                value={event.action?.config[field] || 'info'}
                onChange={(e) => handleActionConfigChange(event.eventType, field, e.target.value)}
              >
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            ) : field === 'method' ? (
              <select
                value={event.action?.config[field] || 'GET'}
                onChange={(e) => handleActionConfigChange(event.eventType, field, e.target.value)}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            ) : (
              <input
                type="text"
                value={event.action?.config[field] || ''}
                onChange={(e) => handleActionConfigChange(event.eventType, field, e.target.value)}
                placeholder={`Enter ${field}...`}
              />
            )}
          </div>
        ))}
      </div>
    );
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
        <button
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
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

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="events-section">
            {/* Add Event Dropdown */}
            <div className="add-event-section">
              <label className="property-label">Add Event Handler</label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddEvent(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="">Select event type...</option>
                {UI_EVENT_TYPES.filter(
                  evt => !(selectedComponent.events || []).some(e => e.eventType === evt.value)
                ).map(evt => (
                  <option key={evt.value} value={evt.value}>{evt.label}</option>
                ))}
              </select>
            </div>

            {/* Configured Events */}
            {(selectedComponent.events || []).length === 0 ? (
              <div className="empty-section">
                <p>No event handlers configured</p>
                <small>Add an event handler above to make this component interactive</small>
              </div>
            ) : (
              <div className="configured-events">
                {(selectedComponent.events || []).map(event => (
                  <div key={event.eventType} className="event-config-card">
                    <div className="event-header">
                      <span className="event-type-label">
                        {UI_EVENT_TYPES.find(e => e.value === event.eventType)?.label || event.eventType}
                      </span>
                      <button
                        className="remove-event-btn"
                        onClick={() => handleRemoveEvent(event.eventType)}
                        title="Remove event"
                      >
                        ×
                      </button>
                    </div>

                    {/* Action Type Selector */}
                    <div className="property-field">
                      <label className="property-label">Action</label>
                      <select
                        value={event.action?.type || ActionType.NONE}
                        onChange={(e) => handleActionTypeChange(event.eventType, e.target.value as ActionType)}
                      >
                        {ACTION_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Action-specific Config Fields */}
                    {renderActionConfigFields(event)}

                    {/* Event Options */}
                    <div className="event-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={event.preventDefault || false}
                          onChange={(e) => handleEventConfigChange(event.eventType, { preventDefault: e.target.checked })}
                        />
                        <span>Prevent Default</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={event.stopPropagation || false}
                          onChange={(e) => handleEventConfigChange(event.eventType, { stopPropagation: e.target.checked })}
                        />
                        <span>Stop Propagation</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={event.previewOnly !== false}
                          onChange={(e) => handleEventConfigChange(event.eventType, { previewOnly: e.target.checked })}
                        />
                        <span>Preview Mode Only</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
