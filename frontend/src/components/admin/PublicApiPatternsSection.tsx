import React, { useState, useEffect } from 'react';
import { ModalSection, ModalField, ModalButton } from '../modals/ModalBase';
import { securityService, PublicApiPattern, CreatePatternRequest } from '../../services/securityService';
import './PublicApiPatternsSection.css';

interface EditingPattern {
  id?: number;
  pattern: string;
  httpMethods: string;
  description: string;
  enabled: boolean;
}

const emptyPattern: EditingPattern = {
  pattern: '',
  httpMethods: 'GET',
  description: '',
  enabled: true,
};

/**
 * PublicApiPatternsSection - Admin section for managing public API patterns
 * These patterns define which API endpoints are accessible without authentication
 */
export const PublicApiPatternsSection: React.FC = () => {
  const [patterns, setPatterns] = useState<PublicApiPattern[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingPattern, setEditingPattern] = useState<EditingPattern>(emptyPattern);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load patterns on mount
  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await securityService.getAllPatterns();
      setPatterns(data);
    } catch (err) {
      setError('Failed to load public API patterns');
      console.error('Error loading patterns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!editingPattern.pattern.trim()) {
      errors.pattern = 'Pattern is required';
    } else if (!editingPattern.pattern.startsWith('/')) {
      errors.pattern = 'Pattern must start with /';
    }

    if (!editingPattern.httpMethods.trim()) {
      errors.httpMethods = 'At least one HTTP method is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAdd = () => {
    setEditingPattern(emptyPattern);
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleEdit = (pattern: PublicApiPattern) => {
    setEditingPattern({
      id: pattern.id,
      pattern: pattern.pattern,
      httpMethods: pattern.httpMethods,
      description: pattern.description || '',
      enabled: pattern.enabled,
    });
    setValidationErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingPattern(emptyPattern);
    setValidationErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const request: CreatePatternRequest = {
        pattern: editingPattern.pattern.trim(),
        httpMethods: editingPattern.httpMethods.trim().toUpperCase(),
        description: editingPattern.description.trim() || undefined,
        enabled: editingPattern.enabled,
      };

      if (editingPattern.id) {
        await securityService.updatePattern(editingPattern.id, request);
        showSuccess('Pattern updated successfully');
      } else {
        await securityService.createPattern(request);
        showSuccess('Pattern created successfully');
      }

      await loadPatterns();
      handleCancel();
    } catch (err: any) {
      const message = err.response?.data?.error || 'Failed to save pattern';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this pattern?')) return;

    setError(null);
    try {
      await securityService.deletePattern(id);
      showSuccess('Pattern deleted successfully');
      await loadPatterns();
    } catch (err) {
      setError('Failed to delete pattern');
    }
  };

  const handleToggleEnabled = async (pattern: PublicApiPattern) => {
    setError(null);
    try {
      await securityService.setEnabled(pattern.id, !pattern.enabled);
      await loadPatterns();
      showSuccess(`Pattern ${pattern.enabled ? 'disabled' : 'enabled'}`);
    } catch (err) {
      setError('Failed to update pattern status');
    }
  };

  const handleFieldChange = (field: keyof EditingPattern, value: string | boolean) => {
    setEditingPattern(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <ModalSection title="Public API Patterns" className="public-api-patterns-section">
      <p className="section-description">
        Configure which API endpoints are accessible without authentication.
        Use Ant-style patterns (e.g., /api/products/**, /api/sample/*).
      </p>

      {error && <div className="modal-alert modal-alert-error">{error}</div>}
      {successMessage && <div className="modal-alert modal-alert-success">{successMessage}</div>}

      {isLoading ? (
        <div className="patterns-loading">Loading patterns...</div>
      ) : isEditing ? (
        <div className="pattern-form">
          <ModalField
            label="Pattern"
            htmlFor="api-pattern"
            required
            error={validationErrors.pattern}
            hint="Use Ant-style patterns: /** for any path, /* for single level"
          >
            <input
              id="api-pattern"
              type="text"
              value={editingPattern.pattern}
              onChange={(e) => handleFieldChange('pattern', e.target.value)}
              placeholder="/api/public/**"
            />
          </ModalField>

          <ModalField
            label="HTTP Methods"
            htmlFor="http-methods"
            required
            error={validationErrors.httpMethods}
            hint="Comma-separated list (GET,POST) or * for all methods"
          >
            <input
              id="http-methods"
              type="text"
              value={editingPattern.httpMethods}
              onChange={(e) => handleFieldChange('httpMethods', e.target.value)}
              placeholder="GET,POST"
            />
          </ModalField>

          <ModalField label="Description" htmlFor="pattern-description">
            <input
              id="pattern-description"
              type="text"
              value={editingPattern.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Optional description"
            />
          </ModalField>

          <div className="pattern-form-checkbox">
            <label>
              <input
                type="checkbox"
                checked={editingPattern.enabled}
                onChange={(e) => handleFieldChange('enabled', e.target.checked)}
              />
              <span>Enabled</span>
            </label>
          </div>

          <div className="pattern-form-actions">
            <ModalButton variant="secondary" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={handleSave} loading={isSaving}>
              {editingPattern.id ? 'Update' : 'Add'} Pattern
            </ModalButton>
          </div>
        </div>
      ) : (
        <>
          <div className="patterns-list">
            {patterns.length === 0 ? (
              <div className="patterns-empty">No public API patterns configured</div>
            ) : (
              patterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className={`pattern-item ${!pattern.enabled ? 'pattern-disabled' : ''}`}
                >
                  <div className="pattern-info">
                    <div className="pattern-path">
                      <code>{pattern.pattern}</code>
                      <span className="pattern-methods">{pattern.httpMethods}</span>
                    </div>
                    {pattern.description && (
                      <div className="pattern-description">{pattern.description}</div>
                    )}
                  </div>
                  <div className="pattern-actions">
                    <button
                      className={`pattern-toggle ${pattern.enabled ? 'enabled' : 'disabled'}`}
                      onClick={() => handleToggleEnabled(pattern)}
                      title={pattern.enabled ? 'Disable' : 'Enable'}
                    >
                      {pattern.enabled ? 'ON' : 'OFF'}
                    </button>
                    <button
                      className="pattern-edit"
                      onClick={() => handleEdit(pattern)}
                      title="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      className="pattern-delete"
                      onClick={() => handleDelete(pattern.id)}
                      title="Delete"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3,6 5,6 21,6" />
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="patterns-footer">
            <ModalButton variant="primary" onClick={handleAdd}>
              + Add Pattern
            </ModalButton>
          </div>
        </>
      )}
    </ModalSection>
  );
};

export default PublicApiPatternsSection;
