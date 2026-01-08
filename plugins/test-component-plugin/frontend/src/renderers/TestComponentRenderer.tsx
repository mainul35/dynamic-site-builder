import React from 'react';
import type { RendererProps } from '../types';

const TestComponentRenderer: React.FC<RendererProps> = ({ component, isEditMode = false }) => {
  const props = component?.props || {};
  const styles = component?.styles || {};

  const text = (props.text as string) || 'Hello Syed Hasan';
  const backgroundColor = (styles.backgroundColor as string) || '#ffffff';
  const color = (styles.color as string) || '#333333';
  const padding = (styles.padding as string) || '16px';

  const containerStyle: React.CSSProperties = {
    fontWeight: "bold",
    backgroundColor,
    color,
    padding,
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
  };

  return (
    <div style={containerStyle} className="TestComponent-container">
      {text}
    </div>
  );
};

export default TestComponentRenderer;
export { TestComponentRenderer };
