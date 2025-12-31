import React, { useState, useEffect } from 'react';
import { ModalBase, ModalSection, ModalField, ModalActions, ModalButton } from './ModalBase';
import { useSiteManagerStore } from '../../stores/siteManagerStore';

export interface SiteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: number;
  onSiteDeleted?: () => void;
}

/**
 * SiteSettingsModal - Edit site configuration
 */
export const SiteSettingsModal: React.FC<SiteSettingsModalProps> = ({ isOpen, onClose, siteId, onSiteDeleted }) => {
  const { sites, currentSiteId, updateSite, deleteSite } = useSiteManagerStore();

  const site = sites.find((s) => s.id === (siteId ?? currentSiteId));

  const [formData, setFormData] = useState({
    siteName: '',
    description: '',
    domain: '',
    faviconUrl: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (site && isOpen) {
      setFormData({
        siteName: site.siteName || '',
        description: site.description || '',
        domain: '',
        faviconUrl: '',
      });
      setErrors({});
      setShowDeleteConfirm(false);
      setDeleteConfirmText('');
    }
  }, [site, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.siteName.trim()) {
      newErrors.siteName = 'Site name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSave = async () => {
    if (!validateForm() || !site) return;

    setIsSaving(true);

    try {
      await updateSite(site.id, {
        siteName: formData.siteName,
        description: formData.description,
      });
      onClose();
    } catch {
      setErrors({ submit: 'Failed to update site settings' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!site || deleteConfirmText !== site.siteName) return;

    setIsDeleting(true);

    try {
      const success = await deleteSite(site.id);
      if (success) {
        onClose();
        onSiteDeleted?.();
      } else {
        setErrors({ submit: 'Failed to delete site' });
      }
    } catch {
      setErrors({ submit: 'Failed to delete site' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!site) return null;

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
    <ModalBase isOpen={isOpen} onClose={onClose} title="Site Settings" size="medium" footer={footer}>
      {errors.submit && <div className="modal-alert modal-alert-error">{errors.submit}</div>}

      <ModalSection title="Basic Information">
        <ModalField label="Site Name" htmlFor="siteName" required error={errors.siteName}>
          <input
            id="siteName"
            type="text"
            value={formData.siteName}
            onChange={(e) => handleChange('siteName', e.target.value)}
            placeholder="My Awesome Site"
          />
        </ModalField>

        <ModalField label="Description" htmlFor="description" hint="Brief description of your site">
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="A brief description of your site..."
            rows={3}
          />
        </ModalField>
      </ModalSection>

      <ModalSection title="Domain Settings">
        <ModalField label="Custom Domain" htmlFor="domain" hint="Optional custom domain for your site">
          <input
            id="domain"
            type="text"
            value={formData.domain}
            onChange={(e) => handleChange('domain', e.target.value)}
            placeholder="www.example.com"
          />
        </ModalField>

        <ModalField label="Favicon URL" htmlFor="faviconUrl" hint="URL to your site's favicon">
          <input
            id="faviconUrl"
            type="url"
            value={formData.faviconUrl}
            onChange={(e) => handleChange('faviconUrl', e.target.value)}
            placeholder="https://example.com/favicon.ico"
          />
        </ModalField>
      </ModalSection>

      <ModalSection title="Site Information">
        <div className="profile-info-row">
          <span className="profile-info-label">Site ID</span>
          <span className="profile-info-value">#{site.id}</span>
        </div>
        <div className="profile-info-row">
          <span className="profile-info-label">Created</span>
          <span className="profile-info-value">
            {site.createdAt ? new Date(site.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="profile-info-row">
          <span className="profile-info-label">Status</span>
          <span className="profile-info-value">{site.status || 'Active'}</span>
        </div>
      </ModalSection>

      <ModalSection title="Danger Zone">
        <div style={{
          padding: '16px',
          border: '1px solid #dc3545',
          borderRadius: '8px',
          backgroundColor: 'rgba(220, 53, 69, 0.05)'
        }}>
          {!showDeleteConfirm ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 500, color: '#dc3545' }}>Delete this site</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Once deleted, this site and all its pages cannot be recovered.
                </div>
              </div>
              <ModalButton
                variant="danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSaving}
              >
                Delete Site
              </ModalButton>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 500, color: '#dc3545', marginBottom: '12px' }}>
                Are you sure you want to delete "{site.siteName}"?
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                This action cannot be undone. All pages, content, and settings will be permanently deleted.
              </div>
              <ModalField
                label={`Type "${site.siteName}" to confirm`}
                htmlFor="deleteConfirm"
              >
                <input
                  id="deleteConfirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={site.siteName}
                  style={{ borderColor: '#dc3545' }}
                />
              </ModalField>
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <ModalButton
                  variant="secondary"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={isDeleting}
                >
                  Cancel
                </ModalButton>
                <ModalButton
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== site.siteName || isDeleting}
                  loading={isDeleting}
                >
                  Delete Site Permanently
                </ModalButton>
              </div>
            </div>
          )}
        </div>
      </ModalSection>
    </ModalBase>
  );
};

export default SiteSettingsModal;
