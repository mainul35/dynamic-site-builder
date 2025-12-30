import React, { useEffect, useRef } from 'react';
import { useClipboardStore } from '../../stores/clipboardStore';
import { useBuilderStore } from '../../stores/builderStore';
import './ComponentContextMenu.css'; // Reuse the same styles

interface CanvasContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
}

/**
 * CanvasContextMenu - Right-click context menu for the empty canvas area
 * Provides paste operation and other canvas-level actions
 */
export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  x,
  y,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const clipboardStore = useClipboardStore();
  const { addComponent, selectComponent } = useBuilderStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Small delay to prevent immediate close from the right-click event
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position to keep menu within viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menuRef.current.style.left = `${adjustedX}px`;
      menuRef.current.style.top = `${adjustedY}px`;
    }
  }, [x, y]);

  const handlePaste = () => {
    const pastedComponents = clipboardStore.paste();
    if (!pastedComponents || pastedComponents.length === 0) {
      onClose();
      return;
    }

    // Add pasted components to root level (no parent)
    pastedComponents.forEach((pastedComponent, index) => {
      const componentToAdd = {
        ...pastedComponent,
        parentId: undefined, // Add to root level
      };

      addComponent(componentToAdd);

      // Select the first pasted component
      if (index === 0) {
        selectComponent(componentToAdd.instanceId);
      }
    });

    // Handle cut operation cleanup
    clipboardStore.getAndClearCutSourceIds();
    onClose();
  };

  const handleSelectAll = () => {
    // TODO: Implement select all components
    console.log('Select all not implemented yet');
    onClose();
  };

  const canPaste = clipboardStore.canPaste();
  const clipboardInfo = clipboardStore.getClipboardInfo();

  return (
    <div
      ref={menuRef}
      className="component-context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="context-menu-header">
        <span className="component-name">Canvas</span>
      </div>

      <div className="context-menu-divider" />

      <button
        className={`context-menu-item ${!canPaste ? 'disabled' : ''}`}
        onClick={handlePaste}
        disabled={!canPaste}
      >
        <span className="menu-icon">📄</span>
        <span className="menu-label">
          Paste{clipboardInfo ? ` (${clipboardInfo.count} ${clipboardInfo.type})` : ''}
        </span>
        <span className="menu-shortcut">Ctrl+V</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item disabled" onClick={handleSelectAll} disabled>
        <span className="menu-icon">☑️</span>
        <span className="menu-label">Select All</span>
        <span className="menu-shortcut">Ctrl+A</span>
      </button>
    </div>
  );
};

export default CanvasContextMenu;
