import React from 'react';

/**
 * Label Component
 * Renders text content with various styling options
 */
const Label = ({ component, isEditMode }) => {
  // Extract props with defaults
  const {
    text = 'Label Text',
    variant = 'p',
    textAlign = 'left',
    truncate = false,
    maxLines = 0,
  } = component.props || {};

  // Get styles from component
  const customStyles = component.styles || {};

  // Build the style object
  const labelStyles = {
    margin: 0,
    padding: 0,
    textAlign: textAlign,
    color: customStyles.color || '#333333',
    fontSize: customStyles.fontSize || '16px',
    fontWeight: customStyles.fontWeight || '400',
    lineHeight: customStyles.lineHeight || '1.5',
    letterSpacing: customStyles.letterSpacing || 'normal',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    ...customStyles,
  };

  // Apply truncation styles if enabled
  if (truncate) {
    labelStyles.overflow = 'hidden';
    labelStyles.textOverflow = 'ellipsis';
    labelStyles.whiteSpace = 'nowrap';
  }

  // Apply max lines clamping if specified
  if (maxLines > 0 && !truncate) {
    labelStyles.display = '-webkit-box';
    labelStyles.WebkitLineClamp = maxLines;
    labelStyles.WebkitBoxOrient = 'vertical';
    labelStyles.overflow = 'hidden';
  }

  // Variant-specific default styles
  const variantStyles = {
    h1: { fontSize: '2.5rem', fontWeight: '700', lineHeight: '1.2' },
    h2: { fontSize: '2rem', fontWeight: '600', lineHeight: '1.25' },
    h3: { fontSize: '1.75rem', fontWeight: '600', lineHeight: '1.3' },
    h4: { fontSize: '1.5rem', fontWeight: '500', lineHeight: '1.35' },
    h5: { fontSize: '1.25rem', fontWeight: '500', lineHeight: '1.4' },
    h6: { fontSize: '1rem', fontWeight: '500', lineHeight: '1.45' },
    p: { fontSize: '1rem', fontWeight: '400', lineHeight: '1.5' },
    span: { fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' },
    caption: { fontSize: '0.875rem', fontWeight: '400', lineHeight: '1.4', color: '#666' },
  };

  // Merge variant defaults with custom styles (custom styles take precedence)
  const finalStyles = {
    ...variantStyles[variant],
    ...labelStyles,
  };

  // Create the element based on variant
  const Element = variant;

  return (
    <Element style={finalStyles} className="label-component">
      {text}
    </Element>
  );
};

export default Label;
export { Label };
