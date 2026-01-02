import React from 'react';
import type { RendererProps } from '../types';

/**
 * HorizontalRowRenderer - Renders a horizontal divider/separator line
 *
 * Props:
 *   - thickness: Line thickness (1px, 2px, 3px, 4px, 5px)
 *   - lineStyle: Line style (solid, dashed, dotted, double)
 *   - width: Line width (25%, 50%, 75%, 100%)
 *   - alignment: Horizontal alignment (left, center, right)
 *
 * Styles:
 *   - color: Line color
 *   - marginTop: Top margin
 *   - marginBottom: Bottom margin
 */
const HorizontalRowRenderer: React.FC<RendererProps> = ({ component }) => {
  const props = component.props || {};
  const styles = component.styles || {};

  // Extract configurable properties with defaults
  const thickness = (props.thickness as string) || '2px';
  const lineStyle = (props.lineStyle as string) || 'solid';
  const width = (props.width as string) || '100%';
  const alignment = (props.alignment as string) || 'center';

  // Extract styles with defaults
  const color = (styles.color as string) || '#e0e0e0';
  const marginTop = (styles.marginTop as string) || '16px';
  const marginBottom = (styles.marginBottom as string) || '16px';

  // Map alignment to flexbox justify-content
  const getJustifyContent = (): string => {
    switch (alignment) {
      case 'left': return 'flex-start';
      case 'right': return 'flex-end';
      case 'center':
      default: return 'center';
    }
  };

  const containerStyles: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: getJustifyContent(),
    alignItems: 'center',
    boxSizing: 'border-box',
    marginTop,
    marginBottom,
  };

  const hrStyles: React.CSSProperties = {
    width,
    height: 0,
    border: 'none',
    borderTop: `${thickness} ${lineStyle} ${color}`,
    margin: 0,
  };

  return (
    <div style={containerStyles} className="horizontal-row-container">
      <hr style={hrStyles} />
    </div>
  );
};

export default HorizontalRowRenderer;
export { HorizontalRowRenderer };
