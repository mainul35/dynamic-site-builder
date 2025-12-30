import React, { useState } from 'react';
import { ModalBase, ModalSection, ModalField, ModalActions, ModalButton } from './ModalBase';
import { useSiteManagerStore } from '../../stores/siteManagerStore';

export interface NewSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (siteId: number) => void;
}

/**
 * NewSiteModal - Create a new site
 */
export const NewSiteModal: React.FC<NewSiteModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { createSite } = useSiteManagerStore();

  const [formData, setFormData] = useState({
    siteName: '',
    description: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ siteName: '', description: '' });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.siteName.trim()) {
      newErrors.siteName = 'Site name is required';
    } else if (formData.siteName.length < 3) {
      newErrors.siteName = 'Site name must be at least 3 characters';
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

  const handleCreate = async () => {
    if (!validateForm()) return;

    setIsCreating(true);

    try {
      const newSite = await createSite({
        siteName: formData.siteName,
        description: formData.description,
      });

      if (newSite) {
        if (onSuccess) {
          onSuccess(newSite.id);
        }
        handleClose();
      } else {
        // createSite returned null - error was set in store
        setErrors({ submit: 'Failed to create site. Please check your connection and try again.' });
      }
    } catch {
      setErrors({ submit: 'Failed to create site. Please try again.' });
    } finally {
      setIsCreating(false);
    }
  };

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={handleClose} disabled={isCreating}>
        Cancel
      </ModalButton>
      <ModalButton variant="primary" onClick={handleCreate} loading={isCreating}>
        Create Site
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Create New Site" size="small" footer={footer}>
      {errors.submit && <div className="modal-alert modal-alert-error">{errors.submit}</div>}

      <ModalSection>
        <ModalField label="Site Name" htmlFor="newSiteName" required error={errors.siteName}>
          <input
            id="newSiteName"
            type="text"
            value={formData.siteName}
            onChange={(e) => handleChange('siteName', e.target.value)}
            placeholder="My New Site"
            autoFocus
          />
        </ModalField>

        <ModalField label="Description" htmlFor="newSiteDescription" hint="Optional description">
          <textarea
            id="newSiteDescription"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder="What is this site about?"
            rows={3}
          />
        </ModalField>
      </ModalSection>

      <div className="modal-alert modal-alert-info">
        A default home page will be created automatically for your new site.
      </div>
    </ModalBase>
  );
};

export default NewSiteModal;
