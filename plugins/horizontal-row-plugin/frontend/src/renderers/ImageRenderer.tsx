import React, { useState } from 'react';
import type { RendererProps } from '../types';

/**
 * ImageRenderer - Renders an image component with configurable properties
 */
const ImageRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const props = component.props || {};
  const src = (props.src as string) || 'https://via.placeholder.com/400x300';
  const alt = (props.alt as string) || 'Image';
  const objectFit = (props.objectFit as string) || 'cover';
  const objectPosition = (props.objectPosition as string) || 'center';
  const aspectRatio = (props.aspectRatio as string) || 'auto';
  const borderRadius = (props.borderRadius as string) || '0px';
  const placeholderColor = (props.placeholderColor as string) || '#e0e0e0';
  const caption = (props.caption as string) || '';
  const showCaption = Boolean(props.showCaption);
  const lazyLoad = props.lazyLoad !== false;

  // Get width/height from props (set via Properties panel)
  const propsWidth = (props.width as string) || '';
  const propsHeight = (props.height as string) || '';

  // Get stored dimensions from component.size (set by ResizableComponent)
  const storedWidth = component.size?.width;
  const storedHeight = component.size?.height;

  // Determine if we're inside a parent container or at root level
  const hasParent = !!component.parentId;

  // Container sizing logic - priority order:
  // 1. Props width/height (from Properties panel) - highest priority
  // 2. Stored dimensions (from resize)
  // 3. Parent-aware defaults (100% for children, auto for root)
  const effectiveWidth = propsWidth || storedWidth || (hasParent ? '100%' : 'auto');
  const effectiveHeight = propsHeight || storedHeight || 'auto';

  const containerStyles: React.CSSProperties = {
    width: effectiveWidth,
    height: effectiveHeight,
    maxWidth: '100%', // Prevent overflow in containers
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
    ...(component.styles as React.CSSProperties),
  };

  // When height is not explicitly set (auto), use aspect ratio to determine height
  // Otherwise, fill the allocated space
  const hasExplicitHeight = (propsHeight && propsHeight !== 'auto') || (storedHeight && storedHeight !== 'auto');
  const useAspectRatio = !hasExplicitHeight;

  const imageWrapperStyles: React.CSSProperties = {
    width: '100%',
    // If explicit height is set, fill it; otherwise use aspect ratio
    height: hasExplicitHeight ? '100%' : 'auto',
    aspectRatio: useAspectRatio ? aspectRatio : undefined,
    backgroundColor: placeholderColor,
    borderRadius: borderRadius,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: objectFit as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
    objectPosition: objectPosition,
    transition: 'opacity 0.3s ease',
    opacity: isLoaded ? 1 : 0,
  };

  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#999',
    fontSize: '14px',
    display: isLoaded ? 'none' : 'block',
  };

  const captionStyles: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '14px',
    color: '#666',
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #e0e0e0',
    textAlign: 'center',
  };

  const errorStyles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#ff4444',
    fontSize: '14px',
    textAlign: 'center',
    padding: '20px',
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setHasError(false);
  };

  const handleImageError = () => {
    setIsLoaded(false);
    setHasError(true);
  };

  return (
    <div style={containerStyles}>
      <div style={imageWrapperStyles}>
        {!hasError ? (
          <>
            <div style={placeholderStyles}>
              {isEditMode && !src ? 'No image selected' : 'Loading...'}
            </div>
            <img
              src={src}
              alt={alt}
              style={imageStyles}
              onLoad={handleImageLoad}
              onError={handleImageError}
              loading={lazyLoad ? 'lazy' : 'eager'}
            />
          </>
        ) : (
          <div style={errorStyles}>
            <div>Failed to load image</div>
            <div style={{ fontSize: '12px', marginTop: '8px', color: '#999' }}>
              {src}
            </div>
          </div>
        )}
      </div>
      {showCaption && caption && (
        <div style={captionStyles}>{caption}</div>
      )}
    </div>
  );
};

export default ImageRenderer;
export { ImageRenderer };
