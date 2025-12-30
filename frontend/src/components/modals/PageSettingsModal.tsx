import React, { useState, useEffect } from 'react';
import { ModalBase, ModalSection, ModalField, ModalActions, ModalButton } from './ModalBase';
import { Page } from '../../types/site';

export interface PageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  page?: Page | null;
  onSave?: (pageId: number, updates: Partial<Page>) => Promise<void>;
}

/**
 * PageSettingsModal - Edit page metadata and SEO settings
 */
export const PageSettingsModal: React.FC<PageSettingsModalProps> = ({
  isOpen,
  onClose,
  page,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    pageName: '',
    pageSlug: '',
    pageTitle: '',
    metaDescription: '',
    metaKeywords: '',
    isHomePage: false,
    isPublished: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (page && isOpen) {
      setFormData({
        pageName: page.pageName || '',
        pageSlug: page.pageSlug || '',
        pageTitle: page.pageTitle || '',
        metaDescription: page.metaDescription || '',
        metaKeywords: page.metaKeywords || '',
        isHomePage: page.isHomePage || false,
        isPublished: page.isPublished !== false,
      });
      setErrors({});
    }
  }, [page, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.pageName.trim()) {
      newErrors.pageName = 'Page name is required';
    }

    if (!formData.pageSlug.trim()) {
      newErrors.pageSlug = 'Page slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.pageSlug)) {
      newErrors.pageSlug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (value: string) => {
    handleChange('pageName', value);
    // Auto-generate slug if it's empty or matches the old auto-generated value
    if (!formData.pageSlug || formData.pageSlug === generateSlug(page?.pageName || '')) {
      handleChange('pageSlug', generateSlug(value));
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !page || !onSave) return;

    setIsSaving(true);

    try {
      await onSave(page.id, {
        pageName: formData.pageName,
        pageSlug: formData.pageSlug,
        pageTitle: formData.pageTitle,
        metaDescription: formData.metaDescription,
        metaKeywords: formData.metaKeywords,
        isHomePage: formData.isHomePage,
        isPublished: formData.isPublished,
      });
      onClose();
    } catch {
      setErrors({ submit: 'Failed to update page settings' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!page) return null;

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={onClose} disabled={isSaving}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleSave} loading={isSaving}>
        Save Changes
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Page Settings" size="medium" footer={footer}>
      {errors.submit && <div className="modal-alert modal-alert-error">{errors.submit}</div>}

      <ModalSection title="Basic Information">
        <ModalField label="Page Name" htmlFor="pageName" required error={errors.pageName}>
          <input
            id="pageName"
            type="text"
            value={formData.pageName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="About Us"
          />
        </ModalField>

        <ModalField
          label="Page Slug"
          htmlFor="pageSlug"
          required
          error={errors.pageSlug}
          hint="URL path for this page (e.g., /about-us)"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/</span>
            <input
              id="pageSlug"
              type="text"
              value={formData.pageSlug}
              onChange={(e) => handleChange('pageSlug', e.target.value.toLowerCase())}
              placeholder="about-us"
              style={{ flex: 1 }}
            />
          </div>
        </ModalField>
      </ModalSection>

      <ModalSection title="SEO Settings">
        <ModalField
          label="Page Title"
          htmlFor="pageTitle"
          hint="Browser tab title (defaults to page name if empty)"
        >
          <input
            id="pageTitle"
            type="text"
            value={formData.pageTitle}
            onChange={(e) => handleChange('pageTitle', e.target.value)}
            placeholder="About Us | My Site"
          />
        </ModalField>

        <ModalField label="Meta Description" htmlFor="metaDescription" hint="Search engine description (150-160 chars recommended)">
          <textarea
            id="metaDescription"
            value={formData.metaDescription}
            onChange={(e) => handleChange('metaDescription', e.target.value)}
            placeholder="A brief description of this page for search engines..."
            rows={3}
            maxLength={200}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>
            {formData.metaDescription.length}/200 characters
          </span>
        </ModalField>

        <ModalField label="Meta Keywords" htmlFor="metaKeywords" hint="Comma-separated keywords">
          <input
            id="metaKeywords"
            type="text"
            value={formData.metaKeywords}
            onChange={(e) => handleChange('metaKeywords', e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
        </ModalField>
      </ModalSection>

      <ModalSection title="Page Options">
        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">Set as Home Page</span>
            <span className="settings-toggle-desc">Make this the site's landing page</span>
          </div>
          <button
            className={`settings-switch ${formData.isHomePage ? 'active' : ''}`}
            onClick={() => handleChange('isHomePage', !formData.isHomePage)}
            aria-label="Toggle home page"
            type="button"
          >
            <span className="settings-switch-knob" />
          </button>
        </div>

        <div className="settings-toggle">
          <div className="settings-toggle-info">
            <span className="settings-toggle-label">Published</span>
            <span className="settings-toggle-desc">Make this page visible to visitors</span>
          </div>
          <button
            className={`settings-switch ${formData.isPublished ? 'active' : ''}`}
            onClick={() => handleChange('isPublished', !formData.isPublished)}
            aria-label="Toggle published"
            type="button"
          >
            <span className="settings-switch-knob" />
          </button>
        </div>
      </ModalSection>
    </ModalBase>
  );
};

export default PageSettingsModal;
