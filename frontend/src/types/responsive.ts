/**
 * Responsive Breakpoint Types and Constants
 *
 * Defines the breakpoint system for responsive design in the PageLayout component.
 * Supports 4 breakpoints: Mobile, Tablet, Desktop, Large
 */

// Breakpoint name type
export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'large';

// Breakpoint definition interface
export interface BreakpointDefinition {
  name: BreakpointName;
  label: string;
  icon: string;
  minWidth: number;
  maxWidth: number | null; // null for "large" (no upper limit)
  canvasWidth: number; // Width to simulate in canvas edit mode
}

// Breakpoint definitions
export const BREAKPOINTS: Record<BreakpointName, BreakpointDefinition> = {
  mobile: {
    name: 'mobile',
    label: 'Mobile',
    icon: '📱',
    minWidth: 0,
    maxWidth: 575,
    canvasWidth: 375,
  },
  tablet: {
    name: 'tablet',
    label: 'Tablet',
    icon: '📱',
    minWidth: 576,
    maxWidth: 991,
    canvasWidth: 768,
  },
  desktop: {
    name: 'desktop',
    label: 'Desktop',
    icon: '💻',
    minWidth: 992,
    maxWidth: 1199,
    canvasWidth: 1024,
  },
  large: {
    name: 'large',
    label: 'Large',
    icon: '🖥️',
    minWidth: 1200,
    maxWidth: null,
    canvasWidth: 1400,
  },
};

// Order of breakpoints (smallest to largest)
export const BREAKPOINT_ORDER: BreakpointName[] = ['mobile', 'tablet', 'desktop', 'large'];

// PageLayout slot type (re-exported for convenience)
export type PageLayoutSlot = 'header' | 'footer' | 'left' | 'right' | 'center';

export const PAGE_LAYOUT_SLOTS: PageLayoutSlot[] = ['header', 'footer', 'left', 'right', 'center'];

// Visibility settings per slot
export interface SlotVisibility {
  header: boolean;
  footer: boolean;
  left: boolean;
  right: boolean;
  center: boolean;
}

// Per-breakpoint responsive settings
export interface BreakpointSettings {
  slotVisibility: SlotVisibility;
  slotStackingOrder: PageLayoutSlot[]; // Order from top to bottom when stacked
  sidebarRatio?: string; // Can override for each breakpoint (e.g., '30-70')
  stackSidebars?: boolean; // If true, sidebars stack below content instead of side-by-side
}

// Responsive configuration object containing settings for all breakpoints
export interface ResponsiveConfig {
  mobile: BreakpointSettings;
  tablet: BreakpointSettings;
  desktop: BreakpointSettings;
  large: BreakpointSettings;
}

// Default responsive configuration with sensible defaults
// Note: sidebarRatio is intentionally NOT set here - the component's sidebarRatio prop
// should be used as the default. Only set sidebarRatio per-breakpoint when you want
// to OVERRIDE the component's base ratio for a specific screen size.
export const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobile: {
    slotVisibility: { header: true, footer: true, left: false, right: false, center: true },
    slotStackingOrder: ['header', 'center', 'footer'],
    stackSidebars: true,
    // No sidebarRatio - sidebars are hidden/stacked anyway
  },
  tablet: {
    slotVisibility: { header: true, footer: true, left: true, right: false, center: true },
    slotStackingOrder: ['header', 'left', 'center', 'footer'],
    // No sidebarRatio - use component's sidebarRatio prop
    stackSidebars: false,
  },
  desktop: {
    slotVisibility: { header: true, footer: true, left: true, right: false, center: true },
    slotStackingOrder: ['header', 'left', 'center', 'footer'],
    // No sidebarRatio - use component's sidebarRatio prop
    stackSidebars: false,
  },
  large: {
    slotVisibility: { header: true, footer: true, left: true, right: true, center: true },
    slotStackingOrder: ['header', 'left', 'center', 'right', 'footer'],
    // No sidebarRatio - use component's sidebarRatio prop
    stackSidebars: false,
  },
};

/**
 * Helper to get breakpoint settings, with fallback to defaults
 */
export function getBreakpointSettings(
  responsive: ResponsiveConfig | undefined,
  breakpoint: BreakpointName
): BreakpointSettings {
  if (responsive && responsive[breakpoint]) {
    return responsive[breakpoint];
  }
  return DEFAULT_RESPONSIVE_CONFIG[breakpoint];
}

/**
 * Generate CSS media query string for a breakpoint
 */
export function getMediaQueryForBreakpoint(breakpoint: BreakpointName): string {
  const def = BREAKPOINTS[breakpoint];
  if (def.maxWidth === null) {
    return `@media (min-width: ${def.minWidth}px)`;
  }
  return `@media (min-width: ${def.minWidth}px) and (max-width: ${def.maxWidth}px)`;
}
