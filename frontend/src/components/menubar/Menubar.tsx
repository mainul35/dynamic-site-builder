import React, { useRef, useCallback, useEffect } from 'react';
import { MenubarProvider, useMenubar } from './MenubarContext';
import './Menubar.css';

export interface MenubarProps {
  children: React.ReactNode;
  className?: string;
}

const MenubarInner: React.FC<MenubarProps> = ({ children, className = '' }) => {
  const { menubarRef, isAnyMenuOpen, closeAllMenus } = useMenubar();
  const navRef = useRef<HTMLElement>(null);

  // Assign ref to context
  useEffect(() => {
    if (navRef.current && menubarRef) {
      (menubarRef as React.MutableRefObject<HTMLElement | null>).current = navRef.current;
    }
  }, [menubarRef]);

  // Handle arrow key navigation between top-level menus
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isAnyMenuOpen) return;

    const menus = navRef.current?.querySelectorAll<HTMLButtonElement>('.menu__trigger');
    if (!menus || menus.length === 0) return;

    const currentIndex = Array.from(menus).findIndex(
      menu => menu.getAttribute('aria-expanded') === 'true'
    );

    if (currentIndex === -1) return;

    let newIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : menus.length - 1;
        menus[newIndex].click();
        break;

      case 'ArrowRight':
        e.preventDefault();
        newIndex = currentIndex < menus.length - 1 ? currentIndex + 1 : 0;
        menus[newIndex].click();
        break;
    }
  }, [isAnyMenuOpen]);

  const classNames = ['menubar', className].filter(Boolean).join(' ');

  return (
    <nav
      ref={navRef}
      role="menubar"
      aria-label="Main menu"
      className={classNames}
      onKeyDown={handleKeyDown}
    >
      {children}
    </nav>
  );
};

export const Menubar: React.FC<MenubarProps> = (props) => {
  return (
    <MenubarProvider>
      <MenubarInner {...props} />
    </MenubarProvider>
  );
};

// Spacer component to push items to the right
export const MenubarSpacer: React.FC = () => {
  return <div className="menubar__spacer" aria-hidden="true" />;
};

// Logo/Brand component for menubar
export interface MenubarBrandProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MenubarBrand: React.FC<MenubarBrandProps> = ({
  children,
  onClick,
  className = '',
}) => {
  const classNames = ['menubar__brand', className].filter(Boolean).join(' ');

  return (
    <div className={classNames} onClick={onClick}>
      {children}
    </div>
  );
};

// Quick action button for menubar (like Publish button)
export interface MenubarButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  className?: string;
  title?: string;
}

export const MenubarButton: React.FC<MenubarButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
  title,
}) => {
  const classNames = [
    'menubar__button',
    `menubar__button--${variant}`,
    disabled && 'menubar__button--disabled',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
};

export default Menubar;
