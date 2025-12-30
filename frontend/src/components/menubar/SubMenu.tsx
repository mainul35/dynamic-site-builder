import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface SubMenuProps {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  isFocused?: boolean;
  onMouseEnter?: () => void;
}

export const SubMenu: React.FC<SubMenuProps> = ({
  label,
  icon,
  children,
  disabled = false,
  className = '',
  isFocused = false,
  onMouseEnter,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const submenuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const submenuId = `submenu-${label.toLowerCase().replaceAll(/\s+/g, '-')}`;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    // Clear any pending close timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsOpen(true);
    onMouseEnter?.();
  }, [disabled, onMouseEnter]);

  const handleMouseLeave = useCallback(() => {
    // Delay close to allow moving to submenu
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150);
  }, []);

  const handleSubmenuMouseEnter = useCallback(() => {
    // Cancel close when entering submenu
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(false);
      triggerRef.current?.focus();
    }
  }, [disabled]);

  // Focus management
  useEffect(() => {
    if (isFocused && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isFocused]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const classNames = [
    'submenu',
    isOpen && 'submenu--open',
    disabled && 'submenu--disabled',
    isFocused && 'submenu--focused',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={submenuRef}
      className={classNames}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="none"
    >
      <button
        ref={triggerRef}
        type="button"
        role="menuitem"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={submenuId}
        className="submenu__trigger"
        disabled={disabled}
        onKeyDown={handleKeyDown}
        tabIndex={isFocused ? 0 : -1}
      >
        {icon && <span className="menu-item__icon">{icon}</span>}
        <span className="menu-item__label">{label}</span>
        <span className="submenu__arrow" aria-hidden="true">&#9654;</span>
      </button>

      {isOpen && (
        <div
          id={submenuId}
          role="menu"
          className="submenu__content"
          onMouseEnter={handleSubmenuMouseEnter}
          onMouseLeave={handleMouseLeave}
          tabIndex={-1}
        >
          {children}
        </div>
      )}
    </div>
  );
};

SubMenu.displayName = 'SubMenu';

export default SubMenu;
