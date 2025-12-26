import React, { useState, useEffect } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import { useComponentStore } from '../../stores/componentStore';
import { ComponentManifest, PropDefinition, PropType, ComponentEventConfig, ActionType } from '../../types/builder';
import { getBuiltInManifest, hasBuiltInManifest } from '../../data/builtInManifests';
import { PageLinkSelector } from './PageLinkSelector';
import './PropertiesPanel.css';

/**
 * NavItem interface for the navigation editor
 */
interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  children?: NavItem[];
}

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
 * Generic JSON Editor Component
 */
interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  helpText?: string;
}

const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, helpText }) => {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      setJsonText(text);
      setError(null);
    } catch {
      setJsonText('');
    }
  }, [value]);

  const handleTextChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      setError(null);
      onChange(parsed);
    } catch (e) {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="json-editor">
      <textarea
        value={jsonText}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder={helpText || 'Enter valid JSON...'}
        rows={6}
        className={error ? 'json-error' : ''}
      />
      {error && <span className="json-error-text">{error}</span>}
    </div>
  );
};

/**
 * Navigation Item Editor - Visual editor for navbar navigation items
 */
interface NavigationEditorProps {
  value: NavItem[] | string;
  onChange: (value: NavItem[]) => void;
}

const NavigationEditor: React.FC<NavigationEditorProps> = ({ value, onChange }) => {
  const [items, setItems] = useState<NavItem[]>([]);
  const [editingItem, setEditingItem] = useState<{ path: number[]; item: NavItem } | null>(null);
  const [showJsonMode, setShowJsonMode] = useState(false);

  // Parse value into NavItem array
  useEffect(() => {
    let parsed: NavItem[] = [];
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        parsed = [];
      }
    } else if (Array.isArray(value)) {
      parsed = value;
    }
    setItems(parsed);
  }, [value]);

  // Helper to get item at path
  const getItemAtPath = (items: NavItem[], path: number[]): NavItem | null => {
    if (path.length === 0) return null;
    let current: NavItem | undefined = items[path[0]];
    for (let i = 1; i < path.length && current; i++) {
      current = current.children?.[path[i]];
    }
    return current || null;
  };

  // Helper to update item at path
  const updateItemAtPath = (items: NavItem[], path: number[], updater: (item: NavItem) => NavItem): NavItem[] => {
    if (path.length === 0) return items;

    const newItems = [...items];
    if (path.length === 1) {
      newItems[path[0]] = updater(newItems[path[0]]);
    } else {
      newItems[path[0]] = {
        ...newItems[path[0]],
        children: updateItemAtPath(newItems[path[0]].children || [], path.slice(1), updater)
      };
    }
    return newItems;
  };

  // Helper to remove item at path
  const removeItemAtPath = (items: NavItem[], path: number[]): NavItem[] => {
    if (path.length === 0) return items;

    if (path.length === 1) {
      return items.filter((_, idx) => idx !== path[0]);
    }

    const newItems = [...items];
    newItems[path[0]] = {
      ...newItems[path[0]],
      children: removeItemAtPath(newItems[path[0]].children || [], path.slice(1))
    };
    return newItems;
  };

  // Add new top-level item
  const addItem = () => {
    const newItem: NavItem = { label: 'New Item', href: '#' };
    const newItems = [...items, newItem];
    setItems(newItems);
    onChange(newItems);
  };

  // Add child item
  const addChildItem = (path: number[]) => {
    const newChild: NavItem = { label: 'Sub Item', href: '#' };
    const newItems = updateItemAtPath(items, path, (item) => ({
      ...item,
      children: [...(item.children || []), newChild]
    }));
    setItems(newItems);
    onChange(newItems);
  };

  // Update item
  const updateItem = (path: number[], updates: Partial<NavItem>) => {
    const newItems = updateItemAtPath(items, path, (item) => ({ ...item, ...updates }));
    setItems(newItems);
    onChange(newItems);
  };

  // Remove item
  const removeItem = (path: number[]) => {
    const newItems = removeItemAtPath(items, path);
    setItems(newItems);
    onChange(newItems);
  };

  // Move item up/down
  const moveItem = (path: number[], direction: 'up' | 'down') => {
    if (path.length === 0) return;

    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];

    const getParentArray = (items: NavItem[], pPath: number[]): NavItem[] => {
      if (pPath.length === 0) return items;
      let current = items;
      for (const idx of pPath) {
        current = current[idx].children || [];
      }
      return current;
    };

    const parentArray = getParentArray(items, parentPath);
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= parentArray.length) return;

    // Swap items
    const newParentArray = [...parentArray];
    [newParentArray[index], newParentArray[newIndex]] = [newParentArray[newIndex], newParentArray[index]];

    let newItems: NavItem[];
    if (parentPath.length === 0) {
      newItems = newParentArray;
    } else {
      newItems = updateItemAtPath(items, parentPath, (item) => ({
        ...item,
        children: newParentArray
      }));
    }

    setItems(newItems);
    onChange(newItems);
  };

  // Render a single nav item (recursive)
  const renderNavItem = (item: NavItem, path: number[], level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isEditing = editingItem && editingItem.path.join(',') === path.join(',');

    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    const getParentArray = (items: NavItem[], pPath: number[]): NavItem[] => {
      if (pPath.length === 0) return items;
      let current = items;
      for (const idx of pPath) {
        current = current[idx].children || [];
      }
      return current;
    };
    const siblings = getParentArray(items, parentPath);

    return (
      <div key={path.join('-')} className="nav-item-editor" style={{ marginLeft: level * 16 }}>
        <div className="nav-item-row">
          <div className="nav-item-controls">
            <button
              className="nav-btn move-btn"
              onClick={() => moveItem(path, 'up')}
              disabled={index === 0}
              title="Move up"
            >
              ↑
            </button>
            <button
              className="nav-btn move-btn"
              onClick={() => moveItem(path, 'down')}
              disabled={index >= siblings.length - 1}
              title="Move down"
            >
              ↓
            </button>
          </div>

          {isEditing ? (
            <div className="nav-item-edit-form">
              <div className="nav-form-field">
                <label className="nav-form-label">Label</label>
                <input
                  type="text"
                  value={editingItem.item.label}
                  onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, label: e.target.value } })}
                  placeholder="Menu item label"
                  className="nav-input label-input"
                />
              </div>
              <div className="nav-form-field">
                <label className="nav-form-label">Link</label>
                <PageLinkSelector
                  value={editingItem.item.href}
                  onChange={(href) => setEditingItem({ ...editingItem, item: { ...editingItem.item, href } })}
                  placeholder="Select page or enter URL"
                  showExternalOption={true}
                />
              </div>
              <label className="nav-checkbox">
                <input
                  type="checkbox"
                  checked={editingItem.item.active || false}
                  onChange={(e) => setEditingItem({ ...editingItem, item: { ...editingItem.item, active: e.target.checked } })}
                />
                Active
              </label>
              <div className="nav-form-actions">
                <button
                  className="nav-btn save-btn"
                  onClick={() => {
                    updateItem(path, editingItem.item);
                    setEditingItem(null);
                  }}
                >
                  Save
                </button>
                <button
                  className="nav-btn cancel-btn"
                  onClick={() => setEditingItem(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-item-display">
              <span className={`nav-item-label ${item.active ? 'active' : ''}`}>
                {item.label}
              </span>
              <span className="nav-item-href">{item.href}</span>
              <div className="nav-item-actions">
                <button
                  className="nav-btn edit-btn"
                  onClick={() => setEditingItem({ path, item: { ...item } })}
                  title="Edit"
                >
                  Edit
                </button>
                <button
                  className="nav-btn add-child-btn"
                  onClick={() => addChildItem(path)}
                  title="Add sub-item"
                >
                  + Sub
                </button>
                <button
                  className="nav-btn delete-btn"
                  onClick={() => removeItem(path)}
                  title="Delete"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Render children */}
        {hasChildren && (
          <div className="nav-children">
            {item.children!.map((child, childIndex) =>
              renderNavItem(child, [...path, childIndex], level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (showJsonMode) {
    return (
      <div className="navigation-editor">
        <div className="nav-editor-header">
          <button
            className="nav-btn mode-btn"
            onClick={() => setShowJsonMode(false)}
          >
            Visual Editor
          </button>
        </div>
        <JsonEditor
          value={items}
          onChange={(newValue) => {
            setItems(newValue);
            onChange(newValue);
          }}
          helpText="Edit navigation items as JSON array"
        />
      </div>
    );
  }

  return (
    <div className="navigation-editor">
      <div className="nav-editor-header">
        <button className="nav-btn add-btn" onClick={addItem}>
          + Add Item
        </button>
        <button
          className="nav-btn mode-btn"
          onClick={() => setShowJsonMode(true)}
        >
          JSON Mode
        </button>
      </div>

      {items.length === 0 ? (
        <div className="nav-empty-state">
          No navigation items. Click "Add Item" to create one.
        </div>
      ) : (
        <div className="nav-items-list">
          {items.map((item, index) => renderNavItem(item, [index], 0))}
        </div>
      )}
    </div>
  );
};

/**
 * PropertiesPanel - Right sidebar for editing component properties and styles
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedComponentId }) => {
  const [activeTab, setActiveTab] = useState<'props' | 'styles' | 'layout' | 'events'>('props');
  const [manifest, setManifest] = useState<ComponentManifest | null>(null);

  const {
    currentPage,
    updateComponent,
    updateComponentProps,
    updateComponentStyles,
    moveComponent,
    resizeComponent,
    removeComponent,
    duplicateComponent,
    findComponent,
    reorderComponent
  } = useBuilderStore();

  const { getManifest, cacheManifest } = useComponentStore();

  const selectedComponent = selectedComponentId ? findComponent(selectedComponentId) : null;

  // Extract stable values for useEffect dependency to prevent unnecessary re-runs
  const pluginId = selectedComponent?.pluginId;
  const componentId = selectedComponent?.componentId;

  // Load component manifest when selection changes
  useEffect(() => {
    if (pluginId && componentId) {
      // First check component store cache
      const cachedManifest = getManifest(pluginId, componentId);
      if (cachedManifest) {
        setManifest(cachedManifest);
        return;
      }

      // Check for built-in manifests (core-ui, core-navbar components)
      if (hasBuiltInManifest(pluginId, componentId)) {
        const builtIn = getBuiltInManifest(pluginId, componentId);
        if (builtIn) {
          // Cache the built-in manifest for future use
          cacheManifest(`${pluginId}:${componentId}`, builtIn);
          setManifest(builtIn);
          return;
        }
      }

      // Fallback: fetch from API for plugin-provided components
      import('../../services/componentService').then(({ componentService }) => {
        componentService.getComponentManifest(pluginId, componentId)
          .then(fetchedManifest => {
            if (fetchedManifest) {
              cacheManifest(`${pluginId}:${componentId}`, fetchedManifest);
              setManifest(fetchedManifest);
            }
          })
          .catch(err => console.error('Failed to fetch manifest:', err));
      });
    } else {
      setManifest(null);
    }
  }, [pluginId, componentId, getManifest, cacheManifest]);

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

  // Get component's index and sibling count for reorder controls
  const getComponentOrderInfo = () => {
    if (!selectedComponent || !currentPage) return { index: 0, total: 0 };

    const parentId = selectedComponent.parentId;
    let siblings: typeof currentPage.components = [];

    if (!parentId) {
      // Root level components
      siblings = currentPage.components.filter(c => !c.parentId);
    } else {
      // Find parent and get its children
      const findParent = (components: typeof currentPage.components): typeof currentPage.components | null => {
        for (const comp of components) {
          if (comp.instanceId === parentId) {
            return comp.children || [];
          }
          if (comp.children && comp.children.length > 0) {
            const found = findParent(comp.children);
            if (found) return found;
          }
        }
        return null;
      };
      siblings = findParent(currentPage.components) || [];
    }

    const index = siblings.findIndex(c => c.instanceId === selectedComponent.instanceId);
    return { index, total: siblings.length };
  };

  const { index: componentIndex, total: siblingCount } = getComponentOrderInfo();

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
            {field === 'url' ? (
              <PageLinkSelector
                value={event.action?.config[field] || ''}
                onChange={(value) => handleActionConfigChange(event.eventType, field, value)}
                placeholder="Select page or enter URL"
                showExternalOption={true}
              />
            ) : field === 'code' ? (
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

      case PropType.JSON:
        // Special handling for navItems - show visual editor
        if (propDef.name === 'navItems') {
          return (
            <NavigationEditor
              value={value}
              onChange={(newValue) => handlePropChange(propDef.name, newValue)}
            />
          );
        }
        // Generic JSON editor for other JSON props
        return (
          <JsonEditor
            value={value}
            onChange={(newValue) => handlePropChange(propDef.name, newValue)}
            helpText={propDef.helpText}
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
            {/* Component Order Controls */}
            <div className="section-title">Component Order</div>
            <div className="order-controls">
              <div className="order-info">
                Position: {componentIndex + 1} of {siblingCount}
              </div>
              <div className="order-buttons">
                <button
                  className="order-btn"
                  onClick={() => reorderComponent(selectedComponent.instanceId, 'top')}
                  disabled={componentIndex === 0}
                  title="Move to Top"
                >
                  ⇈
                </button>
                <button
                  className="order-btn"
                  onClick={() => reorderComponent(selectedComponent.instanceId, 'up')}
                  disabled={componentIndex === 0}
                  title="Move Up"
                >
                  ↑
                </button>
                <button
                  className="order-btn"
                  onClick={() => reorderComponent(selectedComponent.instanceId, 'down')}
                  disabled={componentIndex >= siblingCount - 1}
                  title="Move Down"
                >
                  ↓
                </button>
                <button
                  className="order-btn"
                  onClick={() => reorderComponent(selectedComponent.instanceId, 'bottom')}
                  disabled={componentIndex >= siblingCount - 1}
                  title="Move to Bottom"
                >
                  ⇊
                </button>
              </div>
              <small className="help-text">
                Use these controls to change the stacking order of components on the page
              </small>
            </div>

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
