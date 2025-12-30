import React, { useRef, useCallback, useEffect, useState } from 'react';
import { useMenubar } from './MenubarContext';

export interface MenuProps {
  id?: string;
  label: string | React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const Menu: React.FC<MenuProps> = ({
  id: propId,
  label,
  children,
  align = 'left',
  className = '',
}) => {
  // Auto-generate ID from label if not provided
  const id = propId || (typeof label === 'string'
    ? `menu-${label.toLowerCase().replaceAll(/\s+/g, '-')}`
    : `menu-${Math.random().toString(36).slice(2, 11)}`);
  const {
    isMenuOpen,
    openMenu,
    closeMenu,
    isAnyMenuOpen,
    hoverEnabled,
    focusedItemIndex,
    setFocusedItemIndex,
  } = useMenubar();

  const isOpen = isMenuOpen(id);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [menuItems, setMenuItems] = useState<HTMLElement[]>([]);

  // Collect focusable menu items
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const items = Array.from(
        dropdownRef.current.querySelectorAll<HTMLElement>(
          'button[role="menuitem"]:not([disabled]), [role="menuitem"]:not([aria-disabled="true"])'
        )
      );
      setMenuItems(items);
    } else {
      setMenuItems([]);
    }
  }, [isOpen, children]);

  // Handle keyboard navigation within menu
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      // Open menu on Enter, Space, or ArrowDown when closed
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openMenu(id);
        setFocusedItemIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedItemIndex(prev =>
          prev < menuItems.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedItemIndex(prev =>
          prev > 0 ? prev - 1 : menuItems.length - 1
        );
        break;

      case 'ArrowLeft':
        e.preventDefault();
        // Move to previous menu (handled by parent)
        break;

      case 'ArrowRight':
        e.preventDefault();
        // Move to next menu (handled by parent)
        break;

      case 'Home':
        e.preventDefault();
        setFocusedItemIndex(0);
        break;

      case 'End':
        e.preventDefault();
        setFocusedItemIndex(menuItems.length - 1);
        break;

      case 'Escape':
        e.preventDefault();
        closeMenu();
        triggerRef.current?.focus();
        break;

      case 'Tab':
        // Close menu and allow natural tab navigation
        closeMenu();
        break;
    }
  }, [isOpen, openMenu, closeMenu, id, menuItems.length, setFocusedItemIndex]);

  // Focus the current menu item
  useEffect(() => {
    if (isOpen && menuItems[focusedItemIndex]) {
      menuItems[focusedItemIndex].focus();
    }
  }, [isOpen, focusedItemIndex, menuItems]);

  const handleTriggerClick = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu(id);
    }
  }, [isOpen, openMenu, closeMenu, id]);

  const handleTriggerMouseEnter = useCallback(() => {
    // Traditional desktop behavior: hovering switches menus when one is already open
    if (isAnyMenuOpen && hoverEnabled && !isOpen) {
      openMenu(id);
    }
  }, [isAnyMenuOpen, hoverEnabled, isOpen, openMenu, id]);

  const handleItemClick = useCallback(() => {
    // Close menu after item selection
    closeMenu();
  }, [closeMenu]);

  // Clone children to add click handler for closing menu
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const originalOnClick = child.props.onClick;
      return React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
        onClick: () => {
          originalOnClick?.();
          // Only close if it's a MenuItem (not a SubMenu)
          if (child.type && (child.type as { displayName?: string }).displayName !== 'SubMenu') {
            handleItemClick();
          }
        },
      });
    }
    return child;
  });

  const classNames = [
    'menu',
    isOpen && 'menu--open',
    `menu--align-${align}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={menuRef}
      className={classNames}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={triggerRef}
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={`${id}-dropdown`}
        className="menu__trigger"
        onClick={handleTriggerClick}
        onMouseEnter={handleTriggerMouseEnter}
      >
        {label}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          id={`${id}-dropdown`}
          role="menu"
          className="menu__dropdown menu-dropdown"
          aria-label={typeof label === 'string' ? label : id}
        >
          {enhancedChildren}
        </div>
      )}
    </div>
  );
};

Menu.displayName = 'Menu';

export default Menu;
