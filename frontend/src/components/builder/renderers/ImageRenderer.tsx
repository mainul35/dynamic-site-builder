import React, { useState } from 'react';
import { RendererProps } from './RendererRegistry';

/**
 * ImageRenderer - Renders an image component with various display options
 * Supports placeholder images when no src is provided
 *
 * File naming convention: {ComponentName}Renderer.tsx
 * The component name "Image" is derived from filename "ImageRenderer.tsx"
 */
const ImageRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract props with defaults
  const {
    src = '',
    alt = 'Image',
    objectFit = 'cover',
    objectPosition = 'center',
    aspectRatio = 'auto',
    borderRadius = '0px',
    placeholder = 'icon', // 'icon', 'color', 'blur'
    placeholderColor = '#e9ecef',
    caption = '',
    showCaption = false,
    lazyLoad = true,
  } = component.props;

  // Get styles from component
  const customStyles = component.styles || {};

  // Determine if we should show placeholder
  const showPlaceholder = !src || hasError;

  // Calculate aspect ratio styles
  const getAspectRatioStyles = (): React.CSSProperties => {
    if (aspectRatio === 'auto') {
      return {};
    }

    const ratioMap: Record<string, string> = {
      '1:1': '1 / 1',
      '4:3': '4 / 3',
      '16:9': '16 / 9',
      '3:2': '3 / 2',
      '2:3': '2 / 3',
      '3:4': '3 / 4',
      '9:16': '9 / 16',
      'circle': '1 / 1',
    };

    return {
      aspectRatio: ratioMap[aspectRatio] || aspectRatio,
    };
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    ...customStyles,
  };

  // Image wrapper styles
  const wrapperStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    borderRadius: aspectRatio === 'circle' ? '50%' : borderRadius,
    backgroundColor: placeholderColor,
    ...getAspectRatioStyles(),
  };

  // Image styles
  const imageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: objectFit as React.CSSProperties['objectFit'],
    objectPosition: objectPosition,
    display: isLoading && !showPlaceholder ? 'none' : 'block',
    borderRadius: aspectRatio === 'circle' ? '50%' : borderRadius,
  };

  // Placeholder styles
  const placeholderStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: placeholderColor,
    color: '#6c757d',
    fontSize: '48px',
    borderRadius: aspectRatio === 'circle' ? '50%' : borderRadius,
  };

  // Caption styles
  const captionStyles: React.CSSProperties = {
    marginTop: '8px',
    fontSize: '14px',
    color: '#6c757d',
    textAlign: 'center',
  };

  // Handle image load
  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  // Handle image error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Placeholder icon based on type
  const getPlaceholderContent = () => {
    if (placeholder === 'color') {
      return null;
    }
    // Default icon placeholder
    return (
      <span role="img" aria-label="Image placeholder">
        🖼️
      </span>
    );
  };

  return (
    <div style={containerStyles} className="image-renderer">
      <div style={wrapperStyles} className="image-wrapper">
        {showPlaceholder ? (
          <div style={placeholderStyles} className="image-placeholder">
            {getPlaceholderContent()}
          </div>
        ) : (
          <>
            {isLoading && (
              <div style={placeholderStyles} className="image-loading">
                <span style={{ fontSize: '24px', opacity: 0.5 }}>...</span>
              </div>
            )}
            <img
              src={src}
              alt={alt}
              style={imageStyles}
              onLoad={handleLoad}
              onError={handleError}
              loading={lazyLoad ? 'lazy' : 'eager'}
              className="image-element"
            />
          </>
        )}
      </div>
      {showCaption && caption && (
        <p style={captionStyles} className="image-caption">
          {caption}
        </p>
      )}
    </div>
  );
};

export default ImageRenderer;
export { ImageRenderer };
