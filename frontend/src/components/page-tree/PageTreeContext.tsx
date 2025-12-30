import React, { createContext, useContext, useState, useCallback } from 'react';
import { PageTreeNode } from '../../stores/siteManagerStore';

export type DropPosition = 'before' | 'after' | 'inside';

export interface DragState {
  draggedId: number | null;
  targetId: number | null;
  dropPosition: DropPosition | null;
}

export interface PageTreeContextValue {
  dragState: DragState;
  setDraggedId: (id: number | null) => void;
  setDropTarget: (targetId: number | null, position: DropPosition | null) => void;
  resetDragState: () => void;
  expandedIds: Set<number>;
  toggleExpanded: (id: number) => void;
  setExpanded: (id: number, expanded: boolean) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

const PageTreeContext = createContext<PageTreeContextValue | null>(null);

export interface PageTreeProviderProps {
  children: React.ReactNode;
  pageTree: PageTreeNode[];
  onToggleExpanded?: (pageId: number) => void;
}

export const PageTreeProvider: React.FC<PageTreeProviderProps> = ({
  children,
  pageTree,
  onToggleExpanded,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    draggedId: null,
    targetId: null,
    dropPosition: null,
  });

  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => {
    // Initialize with expanded pages from the store
    const ids = new Set<number>();
    const collectExpanded = (nodes: PageTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.expanded) ids.add(node.page.id);
        if (node.children.length > 0) collectExpanded(node.children);
      });
    };
    collectExpanded(pageTree);
    return ids;
  });

  const setDraggedId = useCallback((id: number | null) => {
    setDragState((prev) => ({ ...prev, draggedId: id }));
  }, []);

  const setDropTarget = useCallback((targetId: number | null, position: DropPosition | null) => {
    setDragState((prev) => ({ ...prev, targetId, dropPosition: position }));
  }, []);

  const resetDragState = useCallback(() => {
    setDragState({ draggedId: null, targetId: null, dropPosition: null });
  }, []);

  const toggleExpanded = useCallback(
    (id: number) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      onToggleExpanded?.(id);
    },
    [onToggleExpanded]
  );

  const setExpanded = useCallback((id: number, expanded: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (expanded) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const ids = new Set<number>();
    const collectIds = (nodes: PageTreeNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          ids.add(node.page.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(pageTree);
    setExpandedIds(ids);
  }, [pageTree]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  return (
    <PageTreeContext.Provider
      value={{
        dragState,
        setDraggedId,
        setDropTarget,
        resetDragState,
        expandedIds,
        toggleExpanded,
        setExpanded,
        expandAll,
        collapseAll,
      }}
    >
      {children}
    </PageTreeContext.Provider>
  );
};

export const usePageTreeContext = (): PageTreeContextValue => {
  const context = useContext(PageTreeContext);
  if (!context) {
    throw new Error('usePageTreeContext must be used within a PageTreeProvider');
  }
  return context;
};

export default PageTreeContext;
