import React from 'react';
import type { RendererProps } from '../types';

/**
 * ScrollableContainerRenderer - Renders a scrollable container with configurable layout
 */
const ScrollableContainerRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const props = component.props || {};
  const scrollDirection = (props.scrollDirection as string) || 'vertical';
  const smoothScroll = props.smoothScroll !== false;
  const hideScrollbar = Boolean(props.hideScrollbar);
  const height = (props.height as string) || '400px';
  const width = (props.width as string) || '100%';
  const layoutType = (props.layoutType as string) || 'none';
  const padding = (props.padding as string) || '16px';
  const gap = (props.gap as string) || '16px';
  const backgroundColor = (props.backgroundColor as string) || 'transparent';
  const borderRadius = (props.borderRadius as string) || '0px';
  const border = (props.border as string) || 'none';
  const boxShadow = (props.boxShadow as string) || 'none';

  const children = component.children || [];

  const containerStyles: React.CSSProperties = {
    width: width,
    height: height,
    overflow: scrollDirection === 'both' ? 'auto' :
              scrollDirection === 'horizontal' ? 'auto hidden' :
              'hidden auto',
    scrollBehavior: smoothScroll ? 'smooth' : 'auto',
    backgroundColor: backgroundColor,
    borderRadius: borderRadius,
    border: border,
    boxShadow: boxShadow,
    padding: padding,
    boxSizing: 'border-box',
    position: 'relative',
    ...(component.styles as React.CSSProperties),
  };

  // Add scrollbar hiding styles if needed
  if (hideScrollbar) {
    Object.assign(containerStyles, {
      scrollbarWidth: 'none', // Firefox
      msOverflowStyle: 'none', // IE and Edge
    });
  }

  // Layout-specific styles
  const contentStyles: React.CSSProperties = {};

  if (layoutType === 'flex-column') {
    Object.assign(contentStyles, {
      display: 'flex',
      flexDirection: 'column',
      gap: gap,
    });
  } else if (layoutType === 'flex-row') {
    Object.assign(contentStyles, {
      display: 'flex',
      flexDirection: 'row',
      gap: gap,
    });
  } else if (layoutType === 'grid') {
    Object.assign(contentStyles, {
      display: 'grid',
      gap: gap,
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    });
  }

  return (
    <div style={containerStyles}>
      {hideScrollbar && (
        <style>
          {`
            div::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
      )}
      <div style={contentStyles}>
        {children.map((child) => (
          <div key={child.instanceId} data-instance-id={child.instanceId}>
            {/* Children will be rendered by the parent component */}
          </div>
        ))}
        {children.length === 0 && isEditMode && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: '#999',
              border: '2px dashed #ddd',
              borderRadius: '4px',
            }}
          >
            Drop components here
          </div>
        )}
      </div>
    </div>
  );
};

export default ScrollableContainerRenderer;
export { ScrollableContainerRenderer };
