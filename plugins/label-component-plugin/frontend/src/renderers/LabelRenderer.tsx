import React from 'react';
import type { ComponentInstance } from '../types';

/**
 * Props for the Label component.
 * Use these props directly: <LabelRenderer text="Hello" variant="h1" />
 */
export interface LabelProps {
  /** The text content to display */
  text?: string;
  /** Typography variant: h1, h2, h3, h4, h5, h6, p, span, caption */
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'caption';
  /** Override the HTML tag (defaults to variant) */
  htmlTag?: string;
  /** Text alignment: left, center, right, justify */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  /** Truncate text with ellipsis */
  truncate?: boolean;
  /** Maximum number of lines before truncating (0 = no limit) */
  maxLines?: number;
  /** Edit mode flag */
  isEditMode?: boolean;
  /** Custom inline styles */
  style?: React.CSSProperties;
  /** Font size */
  fontSize?: string;
  /** Font weight */
  fontWeight?: string | number;
  /** Text color */
  color?: string;
  /** Line height */
  lineHeight?: string | number;
  /** Letter spacing */
  letterSpacing?: string;
  /** Background image (for gradient text) */
  backgroundImage?: string;
  /** @deprecated Use direct props instead. Legacy component prop for backward compatibility */
  component?: ComponentInstance;
}

const LabelRenderer: React.FC<LabelProps> = (props) => {
  // Support both new direct props and legacy component prop
  const isLegacyMode = props.component !== undefined;

  const {
    text = isLegacyMode ? (props.component?.props?.text as string) ?? 'Label Text' : 'Label Text',
    variant = isLegacyMode ? (props.component?.props?.variant as string) : undefined,
    htmlTag = isLegacyMode ? (props.component?.props?.htmlTag as string) : undefined,
    textAlign = isLegacyMode ? (props.component?.props?.textAlign as string) ?? 'left' : 'left',
    truncate = isLegacyMode ? (props.component?.props?.truncate as boolean) ?? false : false,
    maxLines = isLegacyMode ? (props.component?.props?.maxLines as number) ?? 0 : 0,
  } = props;

  // Get custom styles from either direct props or legacy component.styles
  const customStyles: React.CSSProperties = isLegacyMode
    ? (props.component?.styles as React.CSSProperties) || {}
    : {
        fontSize: props.fontSize,
        fontWeight: props.fontWeight,
        color: props.color,
        lineHeight: props.lineHeight,
        letterSpacing: props.letterSpacing,
        backgroundImage: props.backgroundImage,
        ...props.style,
      };

  const elementType = (htmlTag || variant || 'p') as string;

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

  // Check if gradient text is enabled (backgroundImage with gradient)
  const hasGradientText = customStyles.backgroundImage &&
    typeof customStyles.backgroundImage === 'string' &&
    customStyles.backgroundImage.includes('gradient');

  // Build gradient text styles if needed
  const gradientTextStyles: React.CSSProperties = hasGradientText ? {
    backgroundImage: customStyles.backgroundImage,
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
  } : {};

  const labelStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    width: '100%',
    maxWidth: '100%',
    textAlign: textAlign as React.CSSProperties['textAlign'],
    color: '#333333',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
    ...variantDefaults[elementType],
    // Apply custom styles but exclude gradient-related ones if using gradient text
    ...Object.fromEntries(
      Object.entries(customStyles).filter(
        ([key, value]) => value !== undefined && (!hasGradientText || !['backgroundImage', 'backgroundClip', 'WebkitBackgroundClip', 'WebkitTextFillColor'].includes(key))
      )
    ),
    // Apply gradient text styles last to ensure they override
    ...gradientTextStyles,
  };

  if (truncate) {
    labelStyles.overflow = 'hidden';
    labelStyles.textOverflow = 'ellipsis';
    labelStyles.whiteSpace = 'nowrap';
  }

  if ((maxLines as number) > 0 && !truncate) {
    labelStyles.display = '-webkit-box';
    labelStyles.WebkitLineClamp = maxLines as number;
    labelStyles.WebkitBoxOrient = 'vertical';
    labelStyles.overflow = 'hidden';
  }

  const Element = elementType as keyof React.JSX.IntrinsicElements;

  // Container styles to prevent text from overflowing parent bounds
  // Don't use height: 100% as it becomes 0 when parent has height: auto
  const containerStyles: React.CSSProperties = {
    width: '100%',
    minHeight: 'fit-content', // Use fit-content to size based on text
    overflow: 'hidden',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyles}>
      <Element style={labelStyles}>{text as string}</Element>
    </div>
  );
};

export default LabelRenderer;
export { LabelRenderer };
