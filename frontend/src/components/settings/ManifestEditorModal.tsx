import React, { useState } from 'react';
import {
  ModalBase,
  ModalSection,
  ModalField,
  ModalActions,
  ModalButton,
} from '../modals/ModalBase';
import { componentAdminService, ComponentManifest } from '../../services/componentAdminService';
import './ManifestEditorModal.css';

export interface ManifestEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type EditorMode = 'form' | 'json';

interface FormData {
  pluginId: string;
  componentId: string;
  displayName: string;
  category: string;
  icon: string;
  description: string;
  canHaveChildren: boolean;
  defaultWidth: string;
  defaultHeight: string;
  minWidth: string;
  maxWidth: string;
  minHeight: string;
  maxHeight: string;
  resizable: boolean;
}

const CATEGORIES = ['ui', 'layout', 'form', 'widget', 'navbar', 'data', 'composite'];

const DEFAULT_FORM_DATA: FormData = {
  pluginId: '',
  componentId: '',
  displayName: '',
  category: 'ui',
  icon: '',
  description: '',
  canHaveChildren: false,
  defaultWidth: '200px',
  defaultHeight: 'auto',
  minWidth: '',
  maxWidth: '',
  minHeight: '',
  maxHeight: '',
  resizable: true,
};

/**
 * ManifestEditorModal - Modal for manually registering components via manifest
 * Supports both form-based entry and raw JSON editing
 */
export const ManifestEditorModal: React.FC<ManifestEditorModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [mode, setMode] = useState<EditorMode>('form');
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resetState = () => {
    setFormData(DEFAULT_FORM_DATA);
    setJsonText('');
    setJsonError(null);
    setError(null);
    setSuccess(null);
    setIsSubmitting(false);
    setMode('form');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleJsonChange = (value: string) => {
    setJsonText(value);
    setJsonError(null);
    setError(null);

    // Validate JSON as user types
    if (value.trim()) {
      try {
        JSON.parse(value);
      } catch (e) {
        setJsonError('Invalid JSON syntax');
      }
    }
  };

  const formToManifest = (): ComponentManifest => {
    const manifest: ComponentManifest = {
      pluginId: formData.pluginId.trim(),
      componentId: formData.componentId.trim(),
      displayName: formData.displayName.trim(),
      category: formData.category,
      icon: formData.icon.trim() || undefined,
      description: formData.description.trim() || undefined,
      canHaveChildren: formData.canHaveChildren,
      sizeConstraints: {
        defaultWidth: formData.defaultWidth || undefined,
        defaultHeight: formData.defaultHeight || undefined,
        minWidth: formData.minWidth || undefined,
        maxWidth: formData.maxWidth || undefined,
        minHeight: formData.minHeight || undefined,
        maxHeight: formData.maxHeight || undefined,
        resizable: formData.resizable,
      },
    };
    return manifest;
  };

  const manifestToForm = (manifest: ComponentManifest): FormData => {
    return {
      pluginId: manifest.pluginId || '',
      componentId: manifest.componentId || '',
      displayName: manifest.displayName || '',
      category: manifest.category || 'ui',
      icon: manifest.icon || '',
      description: manifest.description || '',
      canHaveChildren: manifest.canHaveChildren || false,
      defaultWidth: manifest.sizeConstraints?.defaultWidth || '200px',
      defaultHeight: manifest.sizeConstraints?.defaultHeight || 'auto',
      minWidth: manifest.sizeConstraints?.minWidth || '',
      maxWidth: manifest.sizeConstraints?.maxWidth || '',
      minHeight: manifest.sizeConstraints?.minHeight || '',
      maxHeight: manifest.sizeConstraints?.maxHeight || '',
      resizable: manifest.sizeConstraints?.resizable !== false,
    };
  };

  const switchToJson = () => {
    const manifest = formToManifest();
    setJsonText(JSON.stringify(manifest, null, 2));
    setMode('json');
  };

  const switchToForm = () => {
    if (jsonText.trim()) {
      try {
        const manifest = JSON.parse(jsonText) as ComponentManifest;
        setFormData(manifestToForm(manifest));
        setJsonError(null);
      } catch (e) {
        setJsonError('Cannot switch to form mode: Invalid JSON');
        return;
      }
    }
    setMode('form');
  };

  const validateForm = (): string | null => {
    if (!formData.pluginId.trim()) {
      return 'Plugin ID is required';
    }
    if (!formData.componentId.trim()) {
      return 'Component ID is required';
    }
    if (!formData.displayName.trim()) {
      return 'Display Name is required';
    }
    if (!formData.category) {
      return 'Category is required';
    }
    // Validate plugin ID format (alphanumeric, hyphens, underscores)
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(formData.pluginId.trim())) {
      return 'Plugin ID must start with a letter and contain only letters, numbers, hyphens, and underscores';
    }
    // Validate component ID format
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(formData.componentId.trim())) {
      return 'Component ID must start with a letter and contain only letters, numbers, hyphens, and underscores';
    }
    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    let manifest: ComponentManifest;

    if (mode === 'form') {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        return;
      }
      manifest = formToManifest();
    } else {
      if (!jsonText.trim()) {
        setError('Please enter manifest JSON');
        return;
      }
      try {
        manifest = JSON.parse(jsonText) as ComponentManifest;
      } catch (e) {
        setError('Invalid JSON syntax');
        return;
      }
      // Validate required fields
      if (!manifest.pluginId || !manifest.componentId || !manifest.displayName || !manifest.category) {
        setError('Missing required fields: pluginId, componentId, displayName, and category are required');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await componentAdminService.registerComponent(manifest);
      setSuccess(`Component "${manifest.displayName}" registered successfully`);

      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to register component';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={handleClose} disabled={isSubmitting}>
        Cancel
      </ModalButton>
      <ModalButton
        variant="primary"
        onClick={handleSubmit}
        disabled={isSubmitting || (mode === 'json' && !!jsonError)}
        loading={isSubmitting}
      >
        {isSubmitting ? 'Registering...' : 'Register Component'}
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Register Component"
      size="large"
      footer={footer}
    >
      <div className="mem-container">
        {/* Mode Toggle */}
        <div className="mem-mode-toggle">
          <button
            className={`mem-mode-btn ${mode === 'form' ? 'active' : ''}`}
            onClick={() => mode !== 'form' && switchToForm()}
            disabled={isSubmitting}
          >
            Form Editor
          </button>
          <button
            className={`mem-mode-btn ${mode === 'json' ? 'active' : ''}`}
            onClick={() => mode !== 'json' && switchToJson()}
            disabled={isSubmitting}
          >
            JSON Editor
          </button>
        </div>

        {/* Messages */}
        {error && <div className="mem-message mem-error">{error}</div>}
        {success && <div className="mem-message mem-success">{success}</div>}

        {mode === 'form' ? (
          <>
            {/* Basic Info Section */}
            <ModalSection title="Basic Information">
              <div className="mem-form-grid">
                <ModalField label="Plugin ID" required htmlFor="pluginId">
                  <input
                    id="pluginId"
                    type="text"
                    className="mem-input"
                    value={formData.pluginId}
                    onChange={(e) => handleFormChange('pluginId', e.target.value)}
                    placeholder="my-component-plugin"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Component ID" required htmlFor="componentId">
                  <input
                    id="componentId"
                    type="text"
                    className="mem-input"
                    value={formData.componentId}
                    onChange={(e) => handleFormChange('componentId', e.target.value)}
                    placeholder="MyComponent"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Display Name" required htmlFor="displayName">
                  <input
                    id="displayName"
                    type="text"
                    className="mem-input"
                    value={formData.displayName}
                    onChange={(e) => handleFormChange('displayName', e.target.value)}
                    placeholder="My Component"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Category" required htmlFor="category">
                  <select
                    id="category"
                    className="mem-select"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    disabled={isSubmitting}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </ModalField>

                <ModalField label="Icon (emoji)" htmlFor="icon">
                  <input
                    id="icon"
                    type="text"
                    className="mem-input mem-input-icon"
                    value={formData.icon}
                    onChange={(e) => handleFormChange('icon', e.target.value)}
                    placeholder="🎨"
                    maxLength={4}
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Description" htmlFor="description">
                  <input
                    id="description"
                    type="text"
                    className="mem-input"
                    value={formData.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="A custom component for..."
                    disabled={isSubmitting}
                  />
                </ModalField>
              </div>
            </ModalSection>

            {/* Component Behavior */}
            <ModalSection title="Component Behavior">
              <div className="mem-checkbox-row">
                <label className="mem-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.canHaveChildren}
                    onChange={(e) => handleFormChange('canHaveChildren', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Can have children (container component)</span>
                </label>

                <label className="mem-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.resizable}
                    onChange={(e) => handleFormChange('resizable', e.target.checked)}
                    disabled={isSubmitting}
                  />
                  <span>Resizable</span>
                </label>
              </div>
            </ModalSection>

            {/* Size Constraints */}
            <ModalSection title="Size Constraints">
              <div className="mem-form-grid mem-form-grid-4">
                <ModalField label="Default Width" htmlFor="defaultWidth">
                  <input
                    id="defaultWidth"
                    type="text"
                    className="mem-input"
                    value={formData.defaultWidth}
                    onChange={(e) => handleFormChange('defaultWidth', e.target.value)}
                    placeholder="200px"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Default Height" htmlFor="defaultHeight">
                  <input
                    id="defaultHeight"
                    type="text"
                    className="mem-input"
                    value={formData.defaultHeight}
                    onChange={(e) => handleFormChange('defaultHeight', e.target.value)}
                    placeholder="auto"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Min Width" htmlFor="minWidth">
                  <input
                    id="minWidth"
                    type="text"
                    className="mem-input"
                    value={formData.minWidth}
                    onChange={(e) => handleFormChange('minWidth', e.target.value)}
                    placeholder="100px"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Max Width" htmlFor="maxWidth">
                  <input
                    id="maxWidth"
                    type="text"
                    className="mem-input"
                    value={formData.maxWidth}
                    onChange={(e) => handleFormChange('maxWidth', e.target.value)}
                    placeholder="100%"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Min Height" htmlFor="minHeight">
                  <input
                    id="minHeight"
                    type="text"
                    className="mem-input"
                    value={formData.minHeight}
                    onChange={(e) => handleFormChange('minHeight', e.target.value)}
                    placeholder="50px"
                    disabled={isSubmitting}
                  />
                </ModalField>

                <ModalField label="Max Height" htmlFor="maxHeight">
                  <input
                    id="maxHeight"
                    type="text"
                    className="mem-input"
                    value={formData.maxHeight}
                    onChange={(e) => handleFormChange('maxHeight', e.target.value)}
                    placeholder="500px"
                    disabled={isSubmitting}
                  />
                </ModalField>
              </div>
            </ModalSection>
          </>
        ) : (
          /* JSON Editor Mode */
          <ModalSection title="Component Manifest JSON">
            <div className="mem-json-editor">
              <textarea
                className={`mem-json-textarea ${jsonError ? 'error' : ''}`}
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder={`{
  "pluginId": "my-component-plugin",
  "componentId": "MyComponent",
  "displayName": "My Component",
  "category": "ui",
  "icon": "🎨",
  "description": "A custom component",
  "canHaveChildren": false,
  "sizeConstraints": {
    "defaultWidth": "200px",
    "defaultHeight": "auto",
    "resizable": true
  }
}`}
                disabled={isSubmitting}
                spellCheck={false}
              />
              {jsonError && <div className="mem-json-error">{jsonError}</div>}
            </div>
          </ModalSection>
        )}

        {/* Preview Card */}
        <ModalSection title="Preview">
          <div className="mem-preview-card">
            <div className="mem-preview-icon">
              {mode === 'form'
                ? formData.icon || '?'
                : (() => {
                    try {
                      return JSON.parse(jsonText || '{}').icon || '?';
                    } catch {
                      return '?';
                    }
                  })()}
            </div>
            <div className="mem-preview-info">
              <div className="mem-preview-name">
                {mode === 'form'
                  ? formData.displayName || 'Component Name'
                  : (() => {
                      try {
                        return JSON.parse(jsonText || '{}').displayName || 'Component Name';
                      } catch {
                        return 'Component Name';
                      }
                    })()}
              </div>
              <div className="mem-preview-meta">
                <span className="mem-preview-id">
                  {mode === 'form'
                    ? formData.componentId || 'component-id'
                    : (() => {
                        try {
                          return JSON.parse(jsonText || '{}').componentId || 'component-id';
                        } catch {
                          return 'component-id';
                        }
                      })()}
                </span>
                <span className="mem-preview-category">
                  {mode === 'form'
                    ? formData.category
                    : (() => {
                        try {
                          return JSON.parse(jsonText || '{}').category || 'ui';
                        } catch {
                          return 'ui';
                        }
                      })()}
                </span>
              </div>
            </div>
          </div>
        </ModalSection>
      </div>
    </ModalBase>
  );
};

export default ManifestEditorModal;
