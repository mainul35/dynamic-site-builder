import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { PageTreeProvider, usePageTreeContext, DropPosition } from './PageTreeContext';
import { PageTreeItem } from './PageTreeItem';
import { useSiteManagerStore, PageTreeNode } from '../../stores/siteManagerStore';
import './PageTree.css';

export interface PageTreeProps {
  activePageId?: number | null;
  onPageSelect: (pageId: number) => void;
  onPageContextMenu?: (e: React.MouseEvent, pageId: number) => void;
}

const PageTreeInner: React.FC<PageTreeProps> = ({
  activePageId,
  onPageSelect,
  onPageContextMenu,
}) => {
  const { pageTree, reorderPages, reparentPage } = useSiteManagerStore();
  const { setDraggedId, setDropTarget, resetDragState, expandAll, collapseAll } = usePageTreeContext();

  const [activeNode, setActiveNode] = useState<PageTreeNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Flatten tree for sortable context
  const flattenTree = useCallback((nodes: PageTreeNode[]): number[] => {
    const ids: number[] = [];
    const flatten = (nodeList: PageTreeNode[]) => {
      nodeList.forEach((node) => {
        ids.push(node.page.id);
        if (node.children.length > 0) {
          flatten(node.children);
        }
      });
    };
    flatten(nodes);
    return ids;
  }, []);

  const findNodeById = useCallback(
    (id: number, nodes: PageTreeNode[] = pageTree): PageTreeNode | null => {
      for (const node of nodes) {
        if (node.page.id === id) return node;
        if (node.children.length > 0) {
          const found = findNodeById(id, node.children);
          if (found) return found;
        }
      }
      return null;
    },
    [pageTree]
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const node = findNodeById(Number(active.id));
      setActiveNode(node);
      setDraggedId(Number(active.id));
    },
    [findNodeById, setDraggedId]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) {
        setDropTarget(null, null);
        return;
      }

      const activeId = Number(active.id);
      const overId = Number(over.id);

      if (activeId === overId) {
        setDropTarget(null, null);
        return;
      }

      // Determine drop position based on cursor position
      const overRect = over.rect;
      const mouseY = (event.activatorEvent as MouseEvent)?.clientY || 0;
      const relativeY = mouseY - overRect.top;
      const height = overRect.height;

      let position: DropPosition;
      if (relativeY < height * 0.25) {
        position = 'before';
      } else if (relativeY > height * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }

      setDropTarget(overId, position);
    },
    [setDropTarget]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      resetDragState();
      setActiveNode(null);

      if (!over || active.id === over.id) return;

      const activeId = Number(active.id);
      const overId = Number(over.id);

      // Get the drop position from drag state
      const overRect = over.rect;
      const mouseY = (event.activatorEvent as MouseEvent)?.clientY || 0;
      const relativeY = mouseY - overRect.top;
      const height = overRect.height;

      let position: DropPosition;
      if (relativeY < height * 0.25) {
        position = 'before';
      } else if (relativeY > height * 0.75) {
        position = 'after';
      } else {
        position = 'inside';
      }

      const targetNode = findNodeById(overId);
      if (!targetNode) return;

      try {
        if (position === 'inside') {
          // Reparent: make active a child of over
          await reparentPage(activeId, overId);
        } else {
          // Reorder: put active before or after over
          const parentId = targetNode.page.parentPageId;

          // Get siblings at the same level
          const getSiblings = (pId: number | null | undefined, nodes: PageTreeNode[]): PageTreeNode[] => {
            if (pId === null || pId === undefined) {
              return nodes;
            }
            for (const node of nodes) {
              if (node.page.id === pId) {
                return node.children;
              }
              const found = getSiblings(pId, node.children);
              if (found.length > 0) return found;
            }
            return [];
          };

          const siblings = getSiblings(parentId, pageTree);
          const targetIndex = siblings.findIndex((s) => s.page.id === overId);

          const newOrder = siblings
            .filter((s) => s.page.id !== activeId)
            .map((s) => s.page.id);

          const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
          newOrder.splice(insertIndex, 0, activeId);

          // If parent changed, first reparent
          const activeNode = findNodeById(activeId);
          if (activeNode && activeNode.page.parentPageId !== parentId) {
            await reparentPage(activeId, parentId ?? null);
          }

          await reorderPages(newOrder);
        }
      } catch (error) {
        console.error('Failed to reorder pages:', error);
      }
    },
    [resetDragState, findNodeById, reparentPage, reorderPages, pageTree]
  );

  const handleDragCancel = useCallback(() => {
    resetDragState();
    setActiveNode(null);
  }, [resetDragState]);

  const pageIds = flattenTree(pageTree);

  if (pageTree.length === 0) {
    return (
      <div className="page-tree-empty">
        <p>No pages yet</p>
        <p className="page-tree-empty-hint">Create a new page from the Site menu</p>
      </div>
    );
  }

  return (
    <div className="page-tree">
      <div className="page-tree-header">
        <span className="page-tree-title">Pages</span>
        <div className="page-tree-actions">
          <button
            className="page-tree-action-btn"
            onClick={expandAll}
            title="Expand all"
            aria-label="Expand all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
              <path d="M2 5l5 5 5-5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          <button
            className="page-tree-action-btn"
            onClick={collapseAll}
            title="Collapse all"
            aria-label="Collapse all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor">
              <path d="M2 9l5-5 5 5" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={pageIds} strategy={verticalListSortingStrategy}>
          <div className="page-tree-list">
            {pageTree.map((node) => (
              <PageTreeItem
                key={node.page.id}
                node={node}
                isActive={node.page.id === activePageId}
                onSelect={onPageSelect}
                onContextMenu={onPageContextMenu}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeNode && (
            <div className="page-tree-drag-overlay">
              <span className="page-tree-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M3 1h8a2 2 0 012 2v8a2 2 0 01-2 2H3a2 2 0 01-2-2V3a2 2 0 012-2z" />
                </svg>
              </span>
              <span>{activeNode.page.pageName}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export const PageTree: React.FC<PageTreeProps> = (props) => {
  const { pageTree, togglePageExpanded } = useSiteManagerStore();

  return (
    <PageTreeProvider pageTree={pageTree} onToggleExpanded={togglePageExpanded}>
      <PageTreeInner {...props} />
    </PageTreeProvider>
  );
};

export default PageTree;
