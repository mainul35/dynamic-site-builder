import React from 'react';
import { RendererProps } from './RendererRegistry';

/**
 * LabelRenderer - Renders a text label component
 * Supports various HTML element types (h1-h6, p, span, caption)
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Label" is derived from filename "LabelRenderer.tsx"
 */
const LabelRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  // Extract props with defaults
  const {
    text = 'Label Text',
    variant = 'p',
    textAlign = 'left',
    truncate = false,
    maxLines = 0,
  } = component.props;

  // Get styles from component
  const customStyles = component.styles || {};

  // Variant-specific default styles
  const variantDefaults: Record<string, React.CSSProperties> = {
    h1: { fontSize: '2.5rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.25 },
    h3: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
    h4: { fontSize: '1.5rem', fontWeight: 500, lineHeight: 1.35 },
    h5: { fontSize: '1.25rem', fontWeight: 500, lineHeight: 1.4 },
    h6: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.45 },
    p: { fontSize: '1rem', fontWeight: 400, lineHeight: 1.5 },
    span: { fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit' },
    caption: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.4, color: '#666' },
  };

  // Build the style object
  const labelStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    textAlign: textAlign as React.CSSProperties['textAlign'],
    color: '#333333',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    // Apply variant defaults first
    ...variantDefaults[variant],
    // Then apply custom styles (they override defaults)
    ...(customStyles as React.CSSProperties),
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

  // Create the element based on variant
  const Element = variant as keyof JSX.IntrinsicElements;

  return (
    <Element style={labelStyles} className="label-renderer">
      {text}
    </Element>
  );
};

export default LabelRenderer;
export { LabelRenderer };
