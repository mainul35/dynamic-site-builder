import React, { useState } from 'react';
import type { RendererProps } from '../types';

/**
 * ButtonRenderer - Renders a button component with its props
 */
const ButtonRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  const {
    text = 'Click Me',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    fullWidth = false,
  } = component.props;

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
    },
    secondary: {
      backgroundColor: '#6c757d',
      color: 'white',
      border: 'none',
    },
    success: {
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
    },
    danger: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
    },
    warning: {
      backgroundColor: '#ffc107',
      color: '#212529',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#007bff',
      border: '2px solid #007bff',
    },
    'outline-light': {
      backgroundColor: 'transparent',
      color: '#ffffff',
      border: '2px solid #ffffff',
    },
    link: {
      backgroundColor: 'transparent',
      color: '#007bff',
      border: 'none',
      textDecoration: 'underline',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    small: {
      padding: '6px 12px',
      fontSize: '13px',
    },
    medium: {
      padding: '8px 16px',
      fontSize: '14px',
    },
    large: {
      padding: '12px 24px',
      fontSize: '16px',
    },
  };

  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#0056b3' },
    secondary: { backgroundColor: '#545b62' },
    success: { backgroundColor: '#218838' },
    danger: { backgroundColor: '#c82333' },
    warning: { backgroundColor: '#e0a800' },
    outline: { backgroundColor: '#007bff', color: 'white' },
    'outline-light': { backgroundColor: '#ffffff', color: '#007bff' },
    link: { textDecoration: 'none' },
  };

  const baseStyles: React.CSSProperties = {
    display: 'block',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    verticalAlign: 'middle',
    userSelect: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : (isEditMode ? 'default' : 'pointer'),
    opacity: disabled ? 0.65 : 1,
    width: fullWidth ? '100%' : 'auto',
    minWidth: 0,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...(variantStyles[variant as string] || variantStyles.primary),
    ...(sizeStyles[size as string] || sizeStyles.medium),
    ...(isHovered && !disabled ? hoverStyles[variant as string] : {}),
    ...(component.styles as React.CSSProperties),
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      return;
    }
    // In production, would navigate or trigger action
  };

  return (
    <button
      style={buttonStyles}
      disabled={disabled as boolean}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
    >
      {text as string}
    </button>
  );
};

export default ButtonRenderer;
export { ButtonRenderer };
