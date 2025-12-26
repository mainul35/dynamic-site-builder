import React, { useEffect, useState, useRef } from 'react';
import './CanvasRuler.css';

interface CanvasRulerProps {
  canvasRef?: React.RefObject<HTMLElement>;
}

/**
 * CanvasRuler - Shows rulers on the top and left side of the canvas
 * Displays pixel measurements to help with design
 */
export const CanvasRuler: React.FC<CanvasRulerProps> = ({ canvasRef }) => {
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const horizontalRulerRef = useRef<HTMLDivElement>(null);
  const verticalRulerRef = useRef<HTMLDivElement>(null);

  // Update dimensions when canvas or window resizes
  useEffect(() => {
    const updateDimensions = () => {
      const canvasArea = document.querySelector('.builder-canvas-area');
      const canvas = document.querySelector('.builder-canvas');

      if (canvasArea && canvas) {
        // Use the canvas area dimensions for the visible area
        setCanvasWidth(canvasArea.clientWidth);
        setCanvasHeight(canvasArea.clientHeight);

        // Get scroll position
        setScrollLeft((canvasArea as HTMLElement).scrollLeft || 0);
        setScrollTop((canvasArea as HTMLElement).scrollTop || 0);
      }
    };

    // Initial update
    updateDimensions();

    // Update on resize
    window.addEventListener('resize', updateDimensions);

    // Update on scroll
    const canvasArea = document.querySelector('.builder-canvas-area');
    if (canvasArea) {
      canvasArea.addEventListener('scroll', updateDimensions);
    }

    // Use ResizeObserver for more accurate dimension tracking
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (canvasArea) {
      resizeObserver.observe(canvasArea);
    }

    return () => {
      window.removeEventListener('resize', updateDimensions);
      if (canvasArea) {
        canvasArea.removeEventListener('scroll', updateDimensions);
      }
      resizeObserver.disconnect();
    };
  }, []);

  // Generate tick marks for the ruler
  const generateTicks = (length: number, scrollOffset: number, orientation: 'horizontal' | 'vertical') => {
    const ticks: JSX.Element[] = [];
    const majorInterval = 100; // Major tick every 100px
    const minorInterval = 10;  // Minor tick every 10px

    // Calculate the start position based on scroll
    const startOffset = Math.floor(scrollOffset / majorInterval) * majorInterval;

    // Generate ticks from start to end of visible area plus some buffer
    for (let i = startOffset; i <= scrollOffset + length + majorInterval; i += minorInterval) {
      const position = i - scrollOffset;

      // Skip if position is outside visible area
      if (position < 0) continue;
      if (position > length) break;

      const isMajor = i % majorInterval === 0;
      const isMid = i % 50 === 0 && !isMajor;

      const tickClass = isMajor ? 'ruler-tick major' : isMid ? 'ruler-tick mid' : 'ruler-tick minor';

      const style = orientation === 'horizontal'
        ? { left: `${position}px` }
        : { top: `${position}px` };

      ticks.push(
        <div key={`${orientation}-${i}`} className={tickClass} style={style}>
          {isMajor && (
            <span className="tick-label">{i}</span>
          )}
        </div>
      );
    }

    return ticks;
  };

  return (
    <>
      {/* Corner */}
      <div className="ruler-corner">
        <span className="corner-label">px</span>
      </div>

      {/* Horizontal Ruler (Top) */}
      <div className="ruler horizontal-ruler" ref={horizontalRulerRef}>
        <div className="ruler-track">
          {generateTicks(canvasWidth, scrollLeft, 'horizontal')}
        </div>
        <div className="ruler-dimension">
          {canvasWidth}px
        </div>
      </div>

      {/* Vertical Ruler (Left) */}
      <div className="ruler vertical-ruler" ref={verticalRulerRef}>
        <div className="ruler-track">
          {generateTicks(canvasHeight, scrollTop, 'vertical')}
        </div>
        <div className="ruler-dimension">
          {canvasHeight}px
        </div>
      </div>
    </>
  );
};
