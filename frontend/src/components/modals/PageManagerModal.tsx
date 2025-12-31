import React, { useState } from 'react';
import { ModalBase, ModalSection, ModalActions, ModalButton } from './ModalBase';
import { useSiteManagerStore, PageTreeNode } from '../../stores/siteManagerStore';
import { Page } from '../../types/site';

export interface PageManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPageSelect?: (page: Page) => void;
  onPageEdit?: (page: Page) => void;
}

/**
 * PageManagerModal - Manage all pages in the current site
 */
export const PageManagerModal: React.FC<PageManagerModalProps> = ({
  isOpen,
  onClose,
  onPageSelect,
  onPageEdit,
}) => {
  const { pageTree, currentSiteId, deletePage, duplicatePage } = useSiteManagerStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const toggleExpand = (pageId: number) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(pageId)) {
        next.delete(pageId);
      } else {
        next.add(pageId);
      }
      return next;
    });
  };

  const handleDelete = async (pageId: number) => {
    setDeletingPageId(pageId);
    try {
      await deletePage(pageId);
      setConfirmDeleteId(null);
    } finally {
      setDeletingPageId(null);
    }
  };

  const handleDuplicate = async (pageId: number) => {
    await duplicatePage(pageId);
  };

  const renderPageNode = (node: PageTreeNode, depth: number = 0): React.ReactNode => {
    const { page, children } = node;
    const hasChildren = children && children.length > 0;
    const isExpanded = expandedNodes.has(page.id);
    const isConfirmingDelete = confirmDeleteId === page.id;
    const isDeleting = deletingPageId === page.id;

    return (
      <div key={page.id}>
        <div
          className="page-manager-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 12px',
            paddingLeft: `${12 + depth * 20}px`,
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: isConfirmingDelete ? 'rgba(220, 53, 69, 0.05)' : 'transparent',
          }}
        >
          {/* Expand/Collapse button */}
          <button
            onClick={() => toggleExpand(page.id)}
            style={{
              width: '20px',
              height: '20px',
              border: 'none',
              background: 'none',
              cursor: hasChildren ? 'pointer' : 'default',
              opacity: hasChildren ? 1 : 0.3,
              marginRight: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            disabled={!hasChildren}
          >
            {hasChildren ? (isExpanded ? '▼' : '▶') : '•'}
          </button>

          {/* Page info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {page.pageName}
              {page.isHomePage && (
                <span style={{ marginLeft: '8px', fontSize: '11px', color: 'var(--primary-color)', fontWeight: 600 }}>
                  HOME
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              /{page.pageSlug}
              {!page.isPublished && (
                <span style={{ marginLeft: '8px', color: '#f59e0b' }}>Draft</span>
              )}
            </div>
          </div>

          {/* Actions */}
          {isConfirmingDelete ? (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#dc3545', marginRight: '8px' }}>Delete?</span>
              <button
                onClick={() => handleDelete(page.id)}
                disabled={isDeleting}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: 'none',
                  borderRadius: '4px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  cursor: isDeleting ? 'wait' : 'pointer',
                }}
              >
                {isDeleting ? '...' : 'Yes'}
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={isDeleting}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                No
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => onPageSelect?.(page)}
                title="Open page"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Open
              </button>
              <button
                onClick={() => onPageEdit?.(page)}
                title="Edit page settings"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDuplicate(page.id)}
                title="Duplicate page"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                Copy
              </button>
              <button
                onClick={() => setConfirmDeleteId(page.id)}
                title="Delete page"
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  border: '1px solid #dc3545',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  color: '#dc3545',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {children.map((child) => renderPageNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={onClose}>
        Close
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Manage Pages" size="large" footer={footer}>
      {!currentSiteId ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Please select a site first to manage its pages.
        </div>
      ) : pageTree.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          No pages found. Create your first page using "New Page..." from the Site menu.
        </div>
      ) : (
        <ModalSection>
          <div style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
          }}>
            {pageTree.map((node) => renderPageNode(node))}
          </div>
          <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {pageTree.length} page{pageTree.length !== 1 ? 's' : ''} in this site
          </div>
        </ModalSection>
      )}
    </ModalBase>
  );
};

export default PageManagerModal;
