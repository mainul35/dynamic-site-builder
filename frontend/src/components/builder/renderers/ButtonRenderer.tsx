import React, { useState } from 'react';
import { RendererProps } from './RendererRegistry';
import { useComponentEvents } from '../events';

/**
 * ButtonRenderer - Renders a button component with its props
 * Used by BuilderCanvas to display buttons with actual styling
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Button" is derived from filename "ButtonRenderer.tsx"
 */
const ButtonRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get event handlers from the event system
  const eventHandlers = useComponentEvents(component, {
    isEditMode,
    additionalHandlers: {
      // Merge with local hover state handlers
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
    },
  });

  // Extract props with defaults
  const {
    text = 'Click Me',
    variant = 'primary',
    size = 'medium',
    disabled = false,
    fullWidth = false,
  } = component.props;

  // Variant styles
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
  };

  // Size styles
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

  // Hover styles
  const hoverStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#0056b3' },
    secondary: { backgroundColor: '#545b62' },
    success: { backgroundColor: '#218838' },
    danger: { backgroundColor: '#c82333' },
    warning: { backgroundColor: '#e0a800' },
  };

  // Base styles
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
    minWidth: 0, // Allow shrinking in grid/flex layouts
    boxSizing: 'border-box',
    outline: 'none',
  };

  // Combine all styles
  const buttonStyles: React.CSSProperties = {
    ...baseStyles,
    ...(variantStyles[variant] || variantStyles.primary),
    ...(sizeStyles[size] || sizeStyles.medium),
    ...(isHovered && !disabled ? hoverStyles[variant] : {}),
    ...(component.styles as React.CSSProperties), // Custom styles from builder
  };

  return (
    <button
      style={buttonStyles}
      disabled={disabled}
      onClick={eventHandlers.onClick}
      onDoubleClick={eventHandlers.onDoubleClick}
      onMouseEnter={eventHandlers.onMouseEnter}
      onMouseLeave={eventHandlers.onMouseLeave}
      onFocus={eventHandlers.onFocus}
      onBlur={eventHandlers.onBlur}
      onKeyDown={eventHandlers.onKeyDown}
      type="button"
    >
      {text}
    </button>
  );
};

export default ButtonRenderer;
export { ButtonRenderer };
