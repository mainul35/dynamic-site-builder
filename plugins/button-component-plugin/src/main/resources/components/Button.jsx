import React from 'react';

/**
 * Button Component
 * A customizable button with multiple variants and sizes
 */
const Button = ({ text, variant, size, disabled, fullWidth, onClick, styles }) => {
  // Variant styles
  const variantStyles = {
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
  const sizeStyles = {
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

  // Base styles
  const baseStyles = {
    display: 'inline-block',
    fontWeight: '500',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    userSelect: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    width: fullWidth ? '100%' : 'auto',
    outline: 'none',
  };

  // Hover styles
  const hoverStyles = {
    primary: { backgroundColor: '#0056b3' },
    secondary: { backgroundColor: '#545b62' },
    success: { backgroundColor: '#218838' },
    danger: { backgroundColor: '#c82333' },
    warning: { backgroundColor: '#e0a800' },
  };

  const [isHovered, setIsHovered] = React.useState(false);

  // Combine all styles
  const buttonStyles = {
    ...baseStyles,
    ...variantStyles[variant] || variantStyles.primary,
    ...sizeStyles[size] || sizeStyles.medium,
    ...(isHovered && !disabled ? hoverStyles[variant] : {}),
    ...styles, // Custom styles from builder
  };

  const handleClick = (e) => {
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      style={buttonStyles}
      disabled={disabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      type="button"
    >
      {text || 'Click Me'}
    </button>
  );
};

// Default props
Button.defaultProps = {
  text: 'Click Me',
  variant: 'primary',
  size: 'medium',
  disabled: false,
  fullWidth: false,
  styles: {},
};

export default Button;
