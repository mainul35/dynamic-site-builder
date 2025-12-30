import React, { useState } from 'react';
import { ModalBase, ModalSection, ModalField, ModalActions, ModalButton } from './ModalBase';
import { useSiteManagerStore, PageTreeNode } from '../../stores/siteManagerStore';

export interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentPageId?: number | null;
  onSuccess?: (pageId: number) => void;
}

/**
 * NewPageModal - Create a new page
 */
export const NewPageModal: React.FC<NewPageModalProps> = ({
  isOpen,
  onClose,
  parentPageId,
  onSuccess,
}) => {
  const { currentSiteId, pageTree, createPage } = useSiteManagerStore();

  const [formData, setFormData] = useState({
    pageName: '',
    pageSlug: '',
    parentPageId: parentPageId ?? null,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Flatten page tree for parent selection
  const flattenTree = (nodes: PageTreeNode[], depth = 0): { id: number; name: string; depth: number }[] => {
    const result: { id: number; name: string; depth: number }[] = [];
    for (const node of nodes) {
      result.push({ id: node.page.id, name: node.page.pageName, depth });
      if (node.children.length > 0) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  };

  const availableParents = flattenTree(pageTree);

  const resetForm = () => {
    setFormData({
      pageName: '',
      pageSlug: '',
      parentPageId: parentPageId ?? null,
    });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleChange = (field: string, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNameChange = (value: string) => {
    handleChange('pageName', value);
    // Auto-generate slug
    if (!formData.pageSlug || formData.pageSlug === generateSlug(formData.pageName)) {
      handleChange('pageSlug', generateSlug(value));
    }
  };

  const handleCreate = async () => {
    if (!validateForm() || !currentSiteId) return;

    setIsCreating(true);

    try {
      const newPage = await createPage({
        pageName: formData.pageName,
        pageSlug: formData.pageSlug,
        parentPageId: formData.parentPageId,
      });

      if (newPage && onSuccess) {
        onSuccess(newPage.id);
      }
      handleClose();
    } catch {
      setErrors({ submit: 'Failed to create page. Please try again.' });
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
        Create Page
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} title="Create New Page" size="small" footer={footer}>
      {errors.submit && <div className="modal-alert modal-alert-error">{errors.submit}</div>}

      <ModalSection>
        <ModalField label="Page Name" htmlFor="newPageName" required error={errors.pageName}>
          <input
            id="newPageName"
            type="text"
            value={formData.pageName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="About Us"
            autoFocus
          />
        </ModalField>

        <ModalField
          label="Page Slug"
          htmlFor="newPageSlug"
          required
          error={errors.pageSlug}
          hint="URL path for this page"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>/</span>
            <input
              id="newPageSlug"
              type="text"
              value={formData.pageSlug}
              onChange={(e) => handleChange('pageSlug', e.target.value.toLowerCase())}
              placeholder="about-us"
              style={{ flex: 1 }}
            />
          </div>
        </ModalField>

        {availableParents.length > 0 && (
          <ModalField label="Parent Page" htmlFor="parentPage" hint="Optional - nest under another page">
            <select
              id="parentPage"
              value={formData.parentPageId ?? ''}
              onChange={(e) =>
                handleChange('parentPageId', e.target.value ? Number(e.target.value) : null)
              }
            >
              <option value="">No parent (top-level page)</option>
              {availableParents.map((p) => (
                <option key={p.id} value={p.id}>
                  {'—'.repeat(p.depth)} {p.name}
                </option>
              ))}
            </select>
          </ModalField>
        )}
      </ModalSection>
    </ModalBase>
  );
};

export default NewPageModal;
