import React, { useEffect, useCallback } from 'react';
import { useClipboardStore } from '../../stores/clipboardStore';
import { useBuilderStore } from '../../stores/builderStore';

export interface ClipboardProviderProps {
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * ClipboardProvider - Provides keyboard shortcuts for cut/copy/paste operations
 * Wraps the builder to handle Ctrl+C, Ctrl+X, Ctrl+V shortcuts
 */
export const ClipboardProvider: React.FC<ClipboardProviderProps> = ({ children, disabled = false }) => {
  const clipboardStore = useClipboardStore();
  const builderStore = useBuilderStore();

  const handleCopy = useCallback(() => {
    const { currentPage, selectedComponentId } = builderStore;
    if (!currentPage?.rootComponent || !selectedComponentId) return;

    // Get all components as a flat tree
    const components = currentPage.rootComponent ? [currentPage.rootComponent] : [];

    // For now, support single selection
    clipboardStore.copy(components, [selectedComponentId]);
  }, [builderStore, clipboardStore]);

  const handleCut = useCallback(() => {
    const { currentPage, selectedComponentId } = builderStore;
    if (!currentPage?.rootComponent || !selectedComponentId) return;

    const components = currentPage.rootComponent ? [currentPage.rootComponent] : [];
    clipboardStore.cut(components, [selectedComponentId]);
  }, [builderStore, clipboardStore]);

  const handlePaste = useCallback(() => {
    const pastedComponents = clipboardStore.paste();
    if (!pastedComponents || pastedComponents.length === 0) return;

    // Get cut source IDs to remove after paste
    const cutSourceIds = clipboardStore.getAndClearCutSourceIds();

    // Add pasted components to the builder
    // This will be integrated with the builder store's component tree manipulation
    console.log('Pasted components:', pastedComponents);
    console.log('Cut source IDs to remove:', cutSourceIds);

    // TODO: Integrate with builderStore to:
    // 1. Add pasted components to the currently selected container or root
    // 2. If cut, remove the source components using cutSourceIds
  }, [clipboardStore]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      // Don't handle if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (!modifier) return;

      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          handleCopy();
          break;
        case 'x':
          e.preventDefault();
          handleCut();
          break;
        case 'v':
          e.preventDefault();
          handlePaste();
          break;
      }
    },
    [disabled, handleCopy, handleCut, handlePaste]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return <>{children}</>;
};

export default ClipboardProvider;
