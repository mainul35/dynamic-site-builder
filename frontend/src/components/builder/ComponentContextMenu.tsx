import React, { useEffect, useRef } from 'react';
import { useClipboardStore } from '../../stores/clipboardStore';
import { useBuilderStore } from '../../stores/builderStore';
import { ComponentInstance } from '../../types/builder';
import './ComponentContextMenu.css';

interface ComponentContextMenuProps {
  x: number;
  y: number;
  component: ComponentInstance;
  onClose: () => void;
  onDelete?: (componentId: string) => void;
  onDuplicate?: (componentId: string) => void;
}

/**
 * ComponentContextMenu - Right-click context menu for components on the canvas
 * Provides cut, copy, paste, duplicate, and delete operations
 */
export const ComponentContextMenu: React.FC<ComponentContextMenuProps> = ({
  x,
  y,
  component,
  onClose,
  onDelete,
  onDuplicate,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const clipboardStore = useClipboardStore();
  const { currentPage, addComponent, removeComponent } = useBuilderStore();

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

  const handleCut = () => {
    if (!currentPage) return;

    // Get all components (flatten from tree if needed)
    const components = currentPage.components || [];
    clipboardStore.cut(components, [component.instanceId]);

    // Remove the component after cutting
    removeComponent(component.instanceId);
    onClose();
  };

  const handleCopy = () => {
    if (!currentPage) return;

    const components = currentPage.components || [];
    clipboardStore.copy(components, [component.instanceId]);
    onClose();
  };

  const handlePaste = () => {
    const pastedComponents = clipboardStore.paste();
    if (!pastedComponents || pastedComponents.length === 0) {
      onClose();
      return;
    }

    // Add pasted components as children of the selected component (if it's a container)
    // or as siblings at the same level
    pastedComponents.forEach((pastedComponent) => {
      // Check if selected component can have children (is a layout/container)
      const isContainer = component.componentCategory?.toLowerCase() === 'layout';

      if (isContainer) {
        // Paste as child of this container
        addComponent({
          ...pastedComponent,
          parentId: component.instanceId,
        });
      } else {
        // Paste as sibling (same parent)
        addComponent({
          ...pastedComponent,
          parentId: component.parentId || undefined,
        });
      }
    });

    // Handle cut operation cleanup
    clipboardStore.getAndClearCutSourceIds();
    onClose();
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate(component.instanceId);
    }
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(component.instanceId);
    }
    onClose();
  };

  const handleBringToFront = () => {
    useBuilderStore.getState().reorderComponent(component.instanceId, 'top');
    onClose();
  };

  const handleSendToBack = () => {
    useBuilderStore.getState().reorderComponent(component.instanceId, 'bottom');
    onClose();
  };

  const handleMoveUp = () => {
    useBuilderStore.getState().reorderComponent(component.instanceId, 'up');
    onClose();
  };

  const handleMoveDown = () => {
    useBuilderStore.getState().reorderComponent(component.instanceId, 'down');
    onClose();
  };

  const canPaste = clipboardStore.canPaste();

  return (
    <div
      ref={menuRef}
      className="component-context-menu"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="context-menu-header">
        <span className="component-name">{component.componentId}</span>
      </div>

      <div className="context-menu-divider" />

      <button className="context-menu-item" onClick={handleCut}>
        <span className="menu-icon">✂️</span>
        <span className="menu-label">Cut</span>
        <span className="menu-shortcut">Ctrl+X</span>
      </button>

      <button className="context-menu-item" onClick={handleCopy}>
        <span className="menu-icon">📋</span>
        <span className="menu-label">Copy</span>
        <span className="menu-shortcut">Ctrl+C</span>
      </button>

      <button
        className={`context-menu-item ${!canPaste ? 'disabled' : ''}`}
        onClick={handlePaste}
        disabled={!canPaste}
      >
        <span className="menu-icon">📄</span>
        <span className="menu-label">Paste</span>
        <span className="menu-shortcut">Ctrl+V</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item" onClick={handleDuplicate}>
        <span className="menu-icon">⧉</span>
        <span className="menu-label">Duplicate</span>
        <span className="menu-shortcut">Ctrl+D</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item" onClick={handleMoveUp}>
        <span className="menu-icon">↑</span>
        <span className="menu-label">Move Up</span>
      </button>

      <button className="context-menu-item" onClick={handleMoveDown}>
        <span className="menu-icon">↓</span>
        <span className="menu-label">Move Down</span>
      </button>

      <button className="context-menu-item" onClick={handleBringToFront}>
        <span className="menu-icon">⬆️</span>
        <span className="menu-label">Bring to Front</span>
      </button>

      <button className="context-menu-item" onClick={handleSendToBack}>
        <span className="menu-icon">⬇️</span>
        <span className="menu-label">Send to Back</span>
      </button>

      <div className="context-menu-divider" />

      <button className="context-menu-item danger" onClick={handleDelete}>
        <span className="menu-icon">🗑️</span>
        <span className="menu-label">Delete</span>
        <span className="menu-shortcut">Del</span>
      </button>
    </div>
  );
};

export default ComponentContextMenu;
