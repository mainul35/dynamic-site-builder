import React from 'react';
import { useUIPreferencesStore } from '../../stores/uiPreferencesStore';
import { BreakpointName, BREAKPOINTS, BREAKPOINT_ORDER } from '../../types/responsive';
import './BreakpointToggle.css';

/**
 * BreakpointToggle Component
 *
 * A button group in the toolbar that allows users to switch between
 * different device breakpoints for responsive design editing.
 *
 * Displays device icons and canvas widths for each breakpoint.
 */
export const BreakpointToggle: React.FC = () => {
  const activeBreakpoint = useUIPreferencesStore((state) => state.activeBreakpoint);
  const setActiveBreakpoint = useUIPreferencesStore((state) => state.setActiveBreakpoint);

  const handleBreakpointClick = (breakpoint: BreakpointName) => {
    setActiveBreakpoint(breakpoint);
  };

  return (
    <div className="breakpoint-toggle" role="group" aria-label="Device breakpoints">
      {BREAKPOINT_ORDER.map((breakpointName) => {
        const breakpoint = BREAKPOINTS[breakpointName];
        const isActive = activeBreakpoint === breakpointName;

        return (
          <button
            key={breakpointName}
            className={`breakpoint-toggle-btn ${isActive ? 'active' : ''}`}
            onClick={() => handleBreakpointClick(breakpointName)}
            title={`${breakpoint.label} (${breakpoint.canvasWidth}px)`}
            aria-pressed={isActive}
          >
            <span className="breakpoint-icon">{breakpoint.icon}</span>
            <span className="breakpoint-width">{breakpoint.canvasWidth}</span>
          </button>
        );
      })}
    </div>
  );
};

export default BreakpointToggle;
