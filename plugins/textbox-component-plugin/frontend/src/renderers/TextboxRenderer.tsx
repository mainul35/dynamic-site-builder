import React, { useState } from 'react';
import type { RendererProps } from '../types';

/**
 * TextboxRenderer - Renders a text input or textarea component
 * Supports single-line input and multiline textarea modes
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Textbox" is derived from filename "TextboxRenderer.tsx"
 */
const TextboxRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Extract props with defaults and type assertions
  const props = component.props || {};
  const placeholder = (props.placeholder as string) || 'Enter text...';
  const type = (props.type as string) || 'text';
  const disabled = Boolean(props.disabled);
  const readOnly = Boolean(props.readOnly);
  const required = Boolean(props.required);
  const multiline = Boolean(props.multiline);
  const rows = (props.rows as number) || 3;
  const maxLength = (props.maxLength as number) || 0;
  const name = (props.name as string) || '';
  const label = (props.label as string) || '';
  const showLabel = Boolean(props.showLabel);

  // Get styles from component
  const customStyles = component.styles || {};

  // Build the style object
  const inputStyles: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '4px',
    border: '1px solid #ccc',
    padding: '8px 12px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#333333',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    resize: multiline ? 'vertical' : 'none',
    fontFamily: 'inherit',
    ...customStyles,
  };

  // Focus styles
  if (isFocused) {
    inputStyles.borderColor = '#007bff';
    inputStyles.boxShadow = '0 0 0 2px rgba(0, 123, 255, 0.25)';
  }

  // Disabled styles
  if (disabled) {
    inputStyles.backgroundColor = '#f5f5f5';
    inputStyles.cursor = 'not-allowed';
    inputStyles.opacity = 0.7;
  }

  // Label styles
  const labelStyles: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    fontWeight: 500,
    color: '#333333',
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    width: '100%',
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!isEditMode) {
      setValue(e.target.value);
    }
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };

  // Common input props
  const inputProps = {
    placeholder,
    disabled: disabled || isEditMode,
    readOnly,
    required,
    name,
    value: isEditMode ? '' : value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    style: inputStyles,
    className: 'textbox-input',
    ...(maxLength > 0 && { maxLength }),
  };

  return (
    <div style={containerStyles} className="textbox-renderer">
      {showLabel && label && (
        <label style={labelStyles} className="textbox-label">
          {label}
          {required && <span style={{ color: '#dc3545', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      {multiline ? (
        <textarea {...inputProps} rows={rows as number} />
      ) : (
        <input {...inputProps} type={type as string} />
      )}
    </div>
  );
};

export default TextboxRenderer;
export { TextboxRenderer };
