import React from 'react';
import type { RendererProps } from '../types';

const LabelRenderer: React.FC<RendererProps> = ({ component }) => {
  const {
    text = 'Label Text',
    variant,
    htmlTag,
    textAlign = 'left',
    truncate = false,
    maxLines = 0,
  } = component.props;

  const elementType = (htmlTag || variant || 'p') as string;
  const customStyles = component.styles || {};

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

  const labelStyles: React.CSSProperties = {
    margin: 0,
    padding: 0,
    textAlign: textAlign as React.CSSProperties['textAlign'],
    color: '#333333',
    wordWrap: 'break-word',
    overflowWrap: 'break-word',
    ...variantDefaults[elementType],
    ...(customStyles as React.CSSProperties),
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

  const Element = elementType as keyof JSX.IntrinsicElements;

  return <Element style={labelStyles}>{text as string}</Element>;
};

export default LabelRenderer;
export { LabelRenderer };
