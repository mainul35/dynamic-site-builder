import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PageTreeNode } from '../../stores/siteManagerStore';
import { usePageTreeContext, DropPosition } from './PageTreeContext';

export interface PageTreeItemProps {
  node: PageTreeNode;
  isActive?: boolean;
  onSelect: (pageId: number) => void;
  onContextMenu?: (e: React.MouseEvent, pageId: number) => void;
  onDuplicate?: (pageId: number) => void;
}

export const PageTreeItem: React.FC<PageTreeItemProps> = ({
  node,
  isActive = false,
  onSelect,
  onContextMenu,
}) => {
  const { dragState, expandedIds, toggleExpanded } = usePageTreeContext();
  const itemRef = useRef<HTMLDivElement>(null);

  const { page, children, depth } = node;
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(page.id);
  const isDragging = dragState.draggedId === page.id;
  const isDropTarget = dragState.targetId === page.id;
  const dropPosition = isDropTarget ? dragState.dropPosition : null;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: page.id,
    data: {
      type: 'page',
      page,
      depth,
    },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${depth * 16 + 8}px`,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(page.id);
  };

  const handleExpandClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpanded(page.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu?.(e, page.id);
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={`page-tree-item ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        {...attributes}
        {...listeners}
      >
        {/* Drop indicator - before */}
        {dropPosition === 'before' && <div className="page-tree-drop-indicator before" />}

        {/* Expand/collapse toggle */}
        <button
          className={`page-tree-toggle ${hasChildren ? 'has-children' : ''}`}
          onClick={handleExpandClick}
          tabIndex={-1}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            >
              <path d="M4 2L8 6L4 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Page icon */}
        <span className="page-tree-icon">
          {page.isHomePage ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M7 1L1 6v7h4v-4h4v4h4V6L7 1z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M3 1h8a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2zm0 1a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V3a1 1 0 00-1-1H3z" />
            </svg>
          )}
        </span>

        {/* Page name */}
        <span className="page-tree-name" title={page.pageName}>
          {page.pageName}
        </span>

        {/* Status badges */}
        <span className="page-tree-badges">
          {page.isHomePage && <span className="page-tree-badge home">Home</span>}
          {page.isPublished === false && <span className="page-tree-badge draft">Draft</span>}
        </span>

        {/* Drop indicator - after */}
        {dropPosition === 'after' && <div className="page-tree-drop-indicator after" />}

        {/* Drop indicator - inside (children) */}
        {dropPosition === 'inside' && <div className="page-tree-drop-indicator inside" />}
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="page-tree-children">
          {children.map((childNode) => (
            <PageTreeItem
              key={childNode.page.id}
              node={childNode}
              isActive={isActive}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default PageTreeItem;
