import React, { useCallback, useRef, useEffect } from 'react';

export interface MenuItemProps {
  children?: React.ReactNode;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
  shortcut?: string;
  icon?: React.ReactNode;
  danger?: boolean;
  toggle?: boolean;
  checked?: boolean;
  isToggle?: boolean;
  isToggled?: boolean;
  className?: string;
  onMouseEnter?: () => void;
  isFocused?: boolean;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  label,
  onClick,
  disabled = false,
  shortcut,
  icon,
  danger = false,
  toggle = false,
  checked = false,
  isToggle = false,
  isToggled = false,
  className = '',
  onMouseEnter,
  isFocused = false,
}) => {
  // Support both naming conventions
  const showToggle = toggle || isToggle;
  const isChecked = checked || isToggled;
  const displayLabel = label || children;
  const itemRef = useRef<HTMLButtonElement>(null);

  const handleClick = useCallback(() => {
    if (!disabled && onClick) {
      onClick();
    }
  }, [disabled, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Focus management
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.focus();
    }
  }, [isFocused]);

  const classNames = [
    'menu-item',
    disabled && 'menu-item--disabled',
    danger && 'menu-item--danger',
    showToggle && 'menu-item--toggle',
    isChecked && 'menu-item--checked',
    isFocused && 'menu-item--focused',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      ref={itemRef}
      role="menuitem"
      className={classNames}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={onMouseEnter}
      disabled={disabled}
      aria-disabled={disabled}
      tabIndex={isFocused ? 0 : -1}
    >
      {showToggle && (
        <span className="menu-item__check" aria-hidden="true">
          {isChecked ? '✓' : ''}
        </span>
      )}
      {icon && <span className="menu-item__icon">{icon}</span>}
      <span className="menu-item__label">{displayLabel}</span>
      {shortcut && (
        <span className="menu-item__shortcut" aria-label={`Keyboard shortcut: ${shortcut}`}>
          {shortcut}
        </span>
      )}
    </button>
  );
};

export default MenuItem;
