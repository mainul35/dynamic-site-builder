import React, { useMemo, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import type { RendererProps, PageLayoutProps, PageLayoutStyles, PageLayoutSlot, ComponentInstance, ResponsiveConfig, BreakpointSettings, MobileSidebarBehavior } from '../types';
import { groupChildrenBySlot } from '../types';

// Breakpoint definitions (matching the main app's responsive.ts)
const BREAKPOINTS = {
  mobile: { minWidth: 0, maxWidth: 575 },
  tablet: { minWidth: 576, maxWidth: 991 },
  desktop: { minWidth: 992, maxWidth: 1199 },
  large: { minWidth: 1200, maxWidth: null },
};

type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'large';

// Default responsive configuration
// Note: sidebarRatio is intentionally NOT set here for most breakpoints
// so that the component's sidebarRatio prop is used as the default.
// Only set sidebarRatio when you want to OVERRIDE the component prop for a specific breakpoint.
const DEFAULT_RESPONSIVE_CONFIG: ResponsiveConfig = {
  mobile: {
    slotVisibility: { header: true, footer: true, left: false, right: false, center: true },
    slotStackingOrder: ['header', 'center', 'footer'],
    stackSidebars: true,
    // No sidebarRatio - sidebars are stacked anyway
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
 * PageLayoutRenderer - Renders a structured page layout with visual wireframe regions
 *
 * In Edit Mode: Shows a visual wireframe with labeled regions (Header, Left Panel, Content, Footer)
 * In Preview Mode: Renders the actual layout with intelligent region expansion
 */

// Access global RendererRegistry exposed by the main app
// This allows us to render children without requiring a renderChild prop
interface RendererRegistry {
  get: (componentId: string, pluginId?: string) => React.FC<RendererProps> | null;
}

const getGlobalRendererRegistry = (): RendererRegistry | null => {
  return (globalThis as unknown as { RendererRegistry?: RendererRegistry }).RendererRegistry || null;
};

/**
 * SlotChildRenderer - Renders a child component using the global RendererRegistry
 * Plugins are expected to be preloaded by MultiPagePreview before rendering
 */
interface SlotChildRendererProps {
  child: ComponentInstance;
  isEditMode: boolean;
  isAutoHeightSlot: boolean;
  childSizeStyles: React.CSSProperties;
}

const SlotChildRenderer: React.FC<SlotChildRendererProps> = ({
  child,
  isEditMode,
  isAutoHeightSlot,
  childSizeStyles,
}) => {
  const registry = getGlobalRendererRegistry();
  const ChildRenderer = registry?.get(child.componentId, child.pluginId);

  if (ChildRenderer) {
    // Respect the heightMode from child props for proper fill/wrap behavior
    // - wrap: no explicit height, let content determine size naturally
    // - fill: height 100%, fills parent container (enables slot scrollbar)
    const childHeightMode = child.props?.heightMode || 'wrap';

    const modifiedChild: ComponentInstance = {
      ...child,
      props: {
        ...child.props,
        maxWidth: 'none',
        centerContent: false,
        heightMode: childHeightMode,
      },
      size: {
        ...child.size,
        width: '100%' as unknown as number,
        // Don't set height - let child component handle its own height based on heightMode
      },
    };

    // For wrap mode, don't set any height - let content determine size
    // For fill mode, use 100% to fill parent
    const wrapperStyle: React.CSSProperties = {
      width: '100%',
      ...(childHeightMode === 'fill' ? { height: '100%' } : {}),
    };

    return (
      <div style={wrapperStyle}>
        <ChildRenderer
          component={modifiedChild}
          isEditMode={isEditMode}
        />
      </div>
    );
  }

  // Renderer not found - show error (plugins should be preloaded by MultiPagePreview)
  const pluginName = child.pluginId || 'unknown';
  const componentName = child.componentId || 'Component';

  // Respect the heightMode from child props
  const childHeightMode = child.props?.heightMode || 'wrap';
  const effectiveHeight = childHeightMode === 'fill' ? '100%' : 'auto';

  return (
    <div
      className="slot-child-error"
      style={{
        width: '100%',
        height: effectiveHeight,
        minHeight: '120px',
        position: 'relative',
        backgroundColor: '#fee2e2',
        border: '3px solid #dc2626',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        backgroundColor: '#dc2626',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '12px',
      }}>
        <span style={{ color: 'white', fontSize: '28px', fontWeight: 'bold' }}>!</span>
      </div>
      <div style={{
        color: '#dc2626',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textAlign: 'center',
      }}>
        Plugin Not Loaded
      </div>
      <div style={{
        backgroundColor: '#fecaca',
        padding: '6px 12px',
        borderRadius: '4px',
        marginBottom: '12px',
      }}>
        <code style={{ color: '#991b1b', fontSize: '14px', fontWeight: '600' }}>
          {componentName}
        </code>
      </div>
      <div style={{
        color: '#7f1d1d',
        fontSize: '13px',
        textAlign: 'center',
        lineHeight: '1.5',
        maxWidth: '300px',
      }}>
        The renderer for <strong>"{componentName}"</strong> from plugin
        <strong> "{pluginName}"</strong> was not found.
      </div>
    </div>
  );
};

interface PageLayoutRendererProps extends RendererProps {
  renderChild?: (child: ComponentInstance) => ReactNode;
}

const PageLayoutRenderer: React.FC<PageLayoutRendererProps> = ({
  component,
  isEditMode,
  renderChild
}) => {
  const props = component.props as PageLayoutProps;
  const styles = component.styles as PageLayoutStyles;

  // State for overlay sidebar toggle (mobile only)
  const [isOverlaySidebarOpen, setIsOverlaySidebarOpen] = useState(false);

  // Container ref for ResizeObserver-based mobile detection
  // This allows overlay mode to work in preview environments where viewport != container width
  const containerRef = useRef<HTMLDivElement>(null);
  const [isContainerMobile, setIsContainerMobile] = useState(false);

  // Fixed layout proportions for the wireframe view
  const headerHeight = '60px';
  const footerHeight = '50px';
  const leftWidth = '180px';

  const {
    gap = '4px',
    fullHeight = true,
    stickyHeader = false,  // Legacy prop
    stickyFooter = false,  // Legacy prop
    headerStickyMode,  // New: 'none' | 'fixed' | 'sticky'
    footerStickyMode,  // New: 'none' | 'fixed' | 'sticky'
    headerMaxHeight,   // New: if set, header becomes scrollable
    footerMaxHeight,   // New: if set, footer becomes scrollable
    sidebarRatio = '30-70',
    mobileSidebarBehavior = 'hidden' as MobileSidebarBehavior,
  } = props;

  // Listen for mobile-navbar-toggle event from MobileNavbar component
  // This allows MobileNavbar to control the sidebar overlay state
  useEffect(() => {
    const handleMobileNavbarToggle = (event: Event) => {
      const customEvent = event as CustomEvent<{ isOpen: boolean; instanceId: string }>;
      // Only handle if overlay mode is enabled
      if (mobileSidebarBehavior === 'overlay') {
        setIsOverlaySidebarOpen(customEvent.detail.isOpen);
      }
    };

    document.addEventListener('mobile-navbar-toggle', handleMobileNavbarToggle);
    return () => {
      document.removeEventListener('mobile-navbar-toggle', handleMobileNavbarToggle);
    };
  }, [mobileSidebarBehavior]);

  // ResizeObserver to detect container width for mobile overlay mode
  // This is needed because CSS media queries check viewport width, but in preview mode
  // the container may be smaller than the viewport (e.g., 375px container in 1400px viewport)
  // Using a state to trigger re-attachment when ref becomes available
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // Callback ref to capture the container element
  const containerCallbackRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      setContainerElement(node);
      // Also set the regular ref for other uses
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, []);

  useEffect(() => {
    if (!containerElement) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        // Use mobile breakpoint threshold (575px)
        setIsContainerMobile(width <= BREAKPOINTS.mobile.maxWidth);
      }
    });

    observer.observe(containerElement);
    return () => observer.disconnect();
  }, [containerElement]);

  // Close overlay sidebar when switching from mobile to desktop container width
  useEffect(() => {
    if (!isContainerMobile && isOverlaySidebarOpen) {
      setIsOverlaySidebarOpen(false);
    }
  }, [isContainerMobile, isOverlaySidebarOpen]);

  // Callback to close overlay sidebar (used by backdrop click)
  const closeOverlaySidebar = useCallback(() => {
    setIsOverlaySidebarOpen(false);
  }, []);

  // Determine effective sticky mode (new props take precedence over legacy)
  // - 'none': scrolls with content
  // - 'fixed': always visible (header at top, footer at bottom)
  // - 'sticky': CSS sticky (scrolls then sticks)
  const effectiveHeaderMode = headerStickyMode || (stickyHeader ? 'fixed' : 'none');
  const effectiveFooterMode = footerStickyMode || (stickyFooter ? 'fixed' : 'none');

  const {
    backgroundColor = '#f8f9fa',
  } = styles;

  // Group children by their assigned slot
  const children = component.children || [];
  const slottedChildren = useMemo(() => groupChildrenBySlot(children), [children]);

  // Determine which regions have content
  const hasHeader = slottedChildren.header.length > 0;
  const hasFooter = slottedChildren.footer.length > 0;
  const hasLeft = slottedChildren.left.length > 0;
  const hasRight = slottedChildren.right.length > 0;

  // Helper to determine slot overflow based on children's heightMode
  // If any child has heightMode: 'wrap', the slot should use overflow: visible
  // to allow the child to expand and push content down (no scrollbar on slot)
  // For fill mode, use overflow: auto so content scrolls within the slot
  const getSlotOverflow = (slot: PageLayoutSlot): 'auto' | 'visible' => {
    const children = slottedChildren[slot];
    if (children.length === 0) return 'auto';

    // Check if any child has heightMode: 'wrap'
    const hasWrapChild = children.some(child => child.props?.heightMode === 'wrap');
    return hasWrapChild ? 'visible' : 'auto';
  };

  // Helper to get child component's size styles
  const getChildSizeStyles = (child: ComponentInstance): React.CSSProperties => {
    const sizeStyles: React.CSSProperties = {};

    // Apply width from size if it's a valid pixel/percentage value
    if (child.size?.width) {
      const width = child.size.width;
      if (typeof width === 'string') {
        sizeStyles.width = width;
      } else if (typeof width === 'number' && width > 0) {
        sizeStyles.width = `${width}px`;
      }
    }

    // Apply height from size if it's a valid pixel/percentage value (not 'auto')
    if (child.size?.height) {
      const height = child.size.height;
      if (typeof height === 'string' && height !== 'auto') {
        sizeStyles.height = height;
      } else if (typeof height === 'number' && height > 0) {
        sizeStyles.height = `${height}px`;
      }
    }

    return sizeStyles;
  };

  // Render children for a specific slot
  // Children in PageLayout slots should fill their slot width (no maxWidth constraint)
  // Header and footer slots: children use natural height (auto) - slot auto-sizes to fit
  // Left, right, center slots: children fill 100% height (they're in flex/grid with defined height)
  const renderSlotChildren = (slot: PageLayoutSlot) => {
    const slotChildren = slottedChildren[slot];

    if (slotChildren.length === 0) return null;

    // If renderChild prop is provided, use it
    if (renderChild) {
      return slotChildren.map(child => renderChild(child));
    }

    // Header/footer have auto height, so children should NOT use 100% (100% of auto = 0)
    // Left/right/center are in a flex container with defined height, so 100% works
    const isAutoHeightSlot = slot === 'header' || slot === 'footer';

    // Use SlotChildRenderer which handles async plugin loading
    return slotChildren.map(child => {
      const childSizeStyles = getChildSizeStyles(child);

      return (
        <SlotChildRenderer
          key={child.instanceId}
          child={child}
          isEditMode={isEditMode}
          isAutoHeightSlot={isAutoHeightSlot}
          childSizeStyles={childSizeStyles}
        />
      );
    });
  };

  // Edit mode - Visual wireframe layout
  if (isEditMode) {
    const regionStyle: React.CSSProperties = {
      border: '1px solid #dee2e6',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    };

    const labelStyle: React.CSSProperties = {
      color: '#6c757d',
      fontSize: '14px',
      fontWeight: 500,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      pointerEvents: 'none',
    };

    const hasContentStyle: React.CSSProperties = {
      position: 'absolute',
      top: '4px',
      right: '4px',
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      backgroundColor: '#28a745',
    };

    // Mobile behavior badge style for left panel
    const mobileBehaviorBadgeStyle: React.CSSProperties = {
      position: 'absolute',
      bottom: '4px',
      left: '4px',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 600,
      textTransform: 'uppercase',
      zIndex: 10,
      pointerEvents: 'none',
    };

    // Get badge color and text based on mobile behavior
    const getMobileBehaviorBadge = () => {
      switch (mobileSidebarBehavior) {
        case 'overlay':
          return { color: '#fff', bg: '#6366f1', text: 'Overlay on Mobile' };
        case 'stacked':
          return { color: '#fff', bg: '#059669', text: 'Stacked on Mobile' };
        case 'hidden':
        default:
          return { color: '#fff', bg: '#6b7280', text: 'Hidden on Mobile' };
      }
    };

    const mobileBadge = getMobileBehaviorBadge();

    // Component badge style for showing what's in a slot
    const componentBadgeStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 600,
      backgroundColor: '#e0e7ff',
      color: '#4338ca',
      marginTop: '4px',
    };

    // Get component names for a slot
    const getSlotComponentNames = (slot: PageLayoutSlot): string[] => {
      return slottedChildren[slot].map(child => child.componentId || 'Component');
    };

    // Toggle overlay sidebar function for edit mode
    const toggleOverlaySidebar = () => setIsOverlaySidebarOpen(!isOverlaySidebarOpen);

    // In edit mode, always show overlay behavior when overlay mode is selected
    // This gives the user a preview of how the layout will look on mobile
    // Note: In edit mode, we show the wireframe even without content in the left slot,
    // so we don't require hasLeft for the overlay to display - users should see how
    // their layout will behave when they add content to the left panel
    const showLeftPanelAsOverlay = mobileSidebarBehavior === 'overlay';

    return (
      <div
        ref={containerCallbackRef}
        className={`page-layout-container edit-mode ${isOverlaySidebarOpen ? 'sidebar-open' : ''}`}
        data-mobile-sidebar-behavior={mobileSidebarBehavior}
        data-container-mobile={isContainerMobile}
        style={{
          display: 'grid',
          gridTemplateRows: `${headerHeight} 1fr ${footerHeight}`,
          // In mobile overlay mode, use single column (left panel becomes overlay)
          gridTemplateColumns: showLeftPanelAsOverlay ? '1fr' : `${leftWidth} 1fr`,
          gap,
          backgroundColor,
          width: '100%',
          height: fullHeight ? '500px' : '400px',
          border: '2px solid #dee2e6',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}
        data-component-type="PageLayout"
      >
        {/* Hamburger menu button for overlay mode in edit mode */}
        {/* Shown when at mobile container width and overlay mode is selected */}
        {showLeftPanelAsOverlay && (
          <button
            className="hamburger-menu"
            onClick={toggleOverlaySidebar}
            aria-label={isOverlaySidebarOpen ? 'Close menu' : 'Open menu'}
            title={isOverlaySidebarOpen ? 'Close sidebar overlay' : 'Open sidebar overlay'}
            style={{
              display: 'flex',
              position: 'absolute',
              top: '10px',
              left: '10px',
              zIndex: 101,
              width: '36px',
              height: '36px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: '#6366f1',
              color: 'white',
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: '3px',
              padding: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            }}
          >
            {/* Hamburger icon lines */}
            <span style={{
              display: 'block',
              width: '16px',
              height: '2px',
              backgroundColor: 'white',
              borderRadius: '1px',
              transition: 'transform 0.2s',
              transform: isOverlaySidebarOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
            }} />
            <span style={{
              display: 'block',
              width: '16px',
              height: '2px',
              backgroundColor: 'white',
              borderRadius: '1px',
              opacity: isOverlaySidebarOpen ? 0 : 1,
              transition: 'opacity 0.2s',
            }} />
            <span style={{
              display: 'block',
              width: '16px',
              height: '2px',
              backgroundColor: 'white',
              borderRadius: '1px',
              transition: 'transform 0.2s',
              transform: isOverlaySidebarOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
            }} />
          </button>
        )}

        {/* Header - spans full width */}
        <div
          className="page-layout-region page-layout-header"
          style={{
            ...regionStyle,
            gridColumn: '1 / -1',
            gridRow: '1 / 2',
          }}
          data-slot="header"
          data-droppable="true"
        >
          {hasHeader && <div style={hasContentStyle} title="Has content" />}
          <span style={labelStyle}>Header</span>
          {hasHeader && (
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
              {renderSlotChildren('header')}
            </div>
          )}
        </div>

        {/* Overlay backdrop for mobile sidebar in edit mode */}
        {showLeftPanelAsOverlay && (
          <div
            className="sidebar-overlay"
            onClick={toggleOverlaySidebar}
            style={{
              display: isOverlaySidebarOpen ? 'block' : 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              cursor: 'pointer',
            }}
          />
        )}

        {/* Left Side Panel */}
        <div
          className="page-layout-region page-layout-left"
          style={
            showLeftPanelAsOverlay
              ? {
                  // Overlay mode: Position absolutely over the center panel
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  position: 'absolute',
                  top: headerHeight,
                  left: 0,
                  width: '200px',
                  height: `calc(100% - ${headerHeight} - ${footerHeight})`,
                  zIndex: 1000,
                  boxShadow: '4px 0 12px rgba(99, 102, 241, 0.3)',
                  border: '3px solid #6366f1',
                  backgroundColor: '#ede9fe',
                }
              : {
                  // Normal grid mode
                  ...regionStyle,
                  gridColumn: '1 / 2',
                  gridRow: '2 / 3',
                  // Visual distinction for stacked mode
                  ...(mobileSidebarBehavior === 'stacked' ? {
                    border: '2px dashed #059669',
                    backgroundColor: '#ecfdf5',
                  } : {}),
                  // Visual distinction for hidden mode
                  ...(mobileSidebarBehavior === 'hidden' ? {
                    border: '1px dashed #9ca3af',
                    backgroundColor: '#f9fafb',
                  } : {}),
                }
          }
          data-slot="left"
          data-droppable="true"
        >
          {/* Labels and badges container - shown above child content */}
          <div style={{
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '4px',
          }}>
            {hasLeft && <div style={{ ...hasContentStyle, position: 'static', marginBottom: '4px' }} title="Has content" />}
            <span style={labelStyle}>Left</span>
            <span style={{ ...labelStyle, fontSize: '12px', marginTop: '2px' }}>Side Panel</span>
            {/* Show component names */}
            {hasLeft && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', justifyContent: 'center' }}>
                {getSlotComponentNames('left').map((name, idx) => (
                  <span key={idx} style={componentBadgeStyle}>{name}</span>
                ))}
              </div>
            )}
            {/* Mobile behavior indicator */}
            <div
              style={{
                ...componentBadgeStyle,
                marginTop: '8px',
                color: mobileBadge.color,
                backgroundColor: mobileBadge.bg,
                fontSize: '9px',
              }}
              title={`This panel will be ${mobileSidebarBehavior} on mobile devices`}
            >
              {mobileBadge.text}
            </div>
          </div>
        </div>

        {/* Content Panel - main area */}
        <div
          className="page-layout-region page-layout-center"
          style={{
            ...regionStyle,
            // In overlay mode at mobile width, center takes full width
            gridColumn: showLeftPanelAsOverlay ? '1 / -1' : '2 / 3',
            gridRow: '2 / 3',
          }}
          data-slot="center"
          data-droppable="true"
        >
          {slottedChildren.center.length > 0 && <div style={hasContentStyle} title="Has content" />}
          <span style={labelStyle}>Content Panel</span>
          {slottedChildren.center.length > 0 && (
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
              {renderSlotChildren('center')}
            </div>
          )}
        </div>

        {/* Footer - spans full width */}
        <div
          className="page-layout-region page-layout-footer"
          style={{
            ...regionStyle,
            gridColumn: '1 / -1',
            gridRow: '3 / 4',
          }}
          data-slot="footer"
          data-droppable="true"
        >
          {hasFooter && <div style={hasContentStyle} title="Has content" />}
          <span style={labelStyle}>Footer</span>
          {hasFooter && (
            <div style={{ width: '100%', height: '100%', position: 'absolute' }}>
              {renderSlotChildren('footer')}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Preview mode - Actual responsive layout with intelligent region expansion
  // Get responsive configuration
  const responsiveConfig: ResponsiveConfig = props.responsive || DEFAULT_RESPONSIVE_CONFIG;

  // Parse sidebar ratio (e.g., '30-70' -> 30% left, 70% center)
  const [leftPercent, centerPercent] = sidebarRatio.split('-').map((s: string) => parseInt(s, 10));

  // Generate unique ID for this layout instance (for scoped CSS)
  const layoutId = `page-layout-${component.instanceId}`;

  // Generate responsive CSS media queries
  // Only generate rules for slots that actually have content
  const generateResponsiveCSS = (): string => {
    const cssRules: string[] = [];
    const breakpointOrder: BreakpointName[] = ['mobile', 'tablet', 'desktop', 'large'];

    breakpointOrder.forEach((bp) => {
      const bpDef = BREAKPOINTS[bp];
      const settings: BreakpointSettings = responsiveConfig[bp];

      // Build media query
      let mediaQuery: string;
      if (bp === 'large') {
        mediaQuery = `@media (min-width: ${bpDef.minWidth}px)`;
      } else {
        mediaQuery = `@media (min-width: ${bpDef.minWidth}px) and (max-width: ${bpDef.maxWidth}px)`;
      }

      // Generate CSS for this breakpoint
      const rules: string[] = [];

      // Determine which sidebars are VISIBLE at this breakpoint (based on responsive config)
      const hasVisibleLeft = hasLeft && settings.slotVisibility.left;
      const hasVisibleRight = hasRight && settings.slotVisibility.right;

      // For mobile breakpoint, handle mobileSidebarBehavior
      const isMobile = bp === 'mobile';
      const sidebarHiddenByConfig = hasLeft && !settings.slotVisibility.left;

      // Slot visibility - handle based on mobileSidebarBehavior for mobile
      if (hasHeader && !settings.slotVisibility.header) {
        rules.push(`#${layoutId} .page-layout-header { display: none !important; }`);
      }
      if (hasFooter && !settings.slotVisibility.footer) {
        rules.push(`#${layoutId} .page-layout-footer { display: none !important; }`);
      }

      // Handle left sidebar visibility based on mobileSidebarBehavior
      if (hasLeft && !settings.slotVisibility.left) {
        if (isMobile && (mobileSidebarBehavior === 'stacked' || mobileSidebarBehavior === 'overlay')) {
          // Don't hide - will be handled by stacked/overlay logic below
        } else {
          rules.push(`#${layoutId} .page-layout-left { display: none !important; }`);
        }
      }

      if (hasRight && !settings.slotVisibility.right) {
        rules.push(`#${layoutId} .page-layout-right { display: none !important; }`);
      }
      if (slottedChildren.center.length > 0 && !settings.slotVisibility.center) {
        rules.push(`#${layoutId} .page-layout-center { display: none !important; }`);
      }

      // Mobile-specific sidebar behavior
      if (isMobile && hasLeft && sidebarHiddenByConfig) {
        if (mobileSidebarBehavior === 'stacked') {
          // Stacked: Show sidebar above center content
          rules.push(`#${layoutId} .page-layout-middle { display: flex !important; flex-direction: column !important; }`);
          rules.push(`#${layoutId} .page-layout-left { display: flex !important; width: 100% !important; order: -1 !important; }`);
          rules.push(`#${layoutId} .page-layout-center { width: 100% !important; flex: 1 !important; }`);
        } else if (mobileSidebarBehavior === 'overlay') {
          // Overlay: Sidebar is positioned as overlay (controlled by JS state)
          // Use absolute positioning relative to .page-layout-middle (which has position: relative)
          // This keeps the overlay within the middle content area (between header and footer)
          // Hide by default, show when .sidebar-open class is added
          rules.push(`#${layoutId} .page-layout-middle { position: relative !important; }`);
          rules.push(`#${layoutId} .page-layout-left {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 280px !important;
            max-width: 85% !important;
            height: 100% !important;
            z-index: 1000 !important;
            transform: translateX(-100%) !important;
            transition: transform 0.3s ease-in-out !important;
            box-shadow: 2px 0 8px rgba(0,0,0,0.15) !important;
            overflow-y: auto !important;
          }`);
          rules.push(`#${layoutId}.sidebar-open .page-layout-left { transform: translateX(0) !important; }`);
          rules.push(`#${layoutId} .sidebar-overlay {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease-in-out;
          }`);
          rules.push(`#${layoutId}.sidebar-open .sidebar-overlay { display: block; opacity: 1; }`);
          // Center takes full width
          rules.push(`#${layoutId} .page-layout-middle { display: flex !important; flex-direction: column !important; }`);
          rules.push(`#${layoutId} .page-layout-center { width: 100% !important; flex: 1 !important; }`);
          // Show hamburger menu button
          rules.push(`#${layoutId} .hamburger-menu { display: flex !important; }`);
        } else {
          // Hidden (default): Completely hide sidebar
          rules.push(`#${layoutId} .page-layout-left { display: none !important; }`);
          rules.push(`#${layoutId} .page-layout-middle { display: flex !important; flex-direction: column !important; }`);
          rules.push(`#${layoutId} .page-layout-center { width: 100% !important; flex: 1 !important; }`);
        }
        // Hide hamburger on non-overlay mode
        if (mobileSidebarBehavior !== 'overlay') {
          rules.push(`#${layoutId} .hamburger-menu { display: none !important; }`);
        }
      } else {
        // Non-mobile or sidebar is visible by config
        // Hide hamburger menu on larger screens
        rules.push(`#${layoutId} .hamburger-menu { display: none !important; }`);

        // Hide overlay backdrop on non-mobile
        rules.push(`#${layoutId} .sidebar-overlay { display: none !important; }`);

        // Reset sidebar to normal grid positioning (undo overlay styles from mobile)
        if (hasLeft && settings.slotVisibility.left) {
          rules.push(`#${layoutId} .page-layout-left {
            position: static !important;
            transform: none !important;
            width: 100% !important;
            max-width: none !important;
            height: auto !important;
            z-index: auto !important;
            box-shadow: none !important;
          }`);
        }

        // Stacking behavior - only apply if there are sidebars that are VISIBLE at this breakpoint
        if (settings.stackSidebars && (hasVisibleLeft || hasVisibleRight)) {
          rules.push(`#${layoutId} .page-layout-middle { display: flex !important; flex-direction: column !important; }`);
          rules.push(`#${layoutId} .page-layout-middle > * { width: 100% !important; }`);
        } else if (hasVisibleLeft || hasVisibleRight) {
          // Reset to grid layout for non-stacking mode
          rules.push(`#${layoutId} .page-layout-middle { display: grid !important; }`);
        }

        // When sidebars exist but are HIDDEN at this breakpoint, fix the grid layout
        if ((hasLeft && !settings.slotVisibility.left) || (hasRight && !settings.slotVisibility.right)) {
          if (!hasVisibleLeft && !hasVisibleRight) {
            rules.push(`#${layoutId} .page-layout-middle { display: flex !important; flex-direction: column !important; }`);
            rules.push(`#${layoutId} .page-layout-center { width: 100% !important; flex: 1 !important; }`);
          } else if (hasVisibleLeft && !hasVisibleRight) {
            rules.push(`#${layoutId} .page-layout-middle { grid-template-columns: ${leftPercent}% 1fr !important; }`);
          } else if (!hasVisibleLeft && hasVisibleRight) {
            rules.push(`#${layoutId} .page-layout-middle { grid-template-columns: 1fr 250px !important; }`);
          }
        }
      }

      if (rules.length > 0) {
        cssRules.push(`${mediaQuery} {\n  ${rules.join('\n  ')}\n}`);
      }
    });

    // Add overlay rules - these apply when overlay mode is selected
    // We use both container-based AND viewport-based rules for maximum compatibility
    if (hasLeft && mobileSidebarBehavior === 'overlay') {
      // Container-based rules (when ResizeObserver detects mobile width)
      const containerOverlayRules = [
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] {
          display: flex !important;
          flex-direction: column !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .page-layout-header {
          width: 100% !important;
          grid-column: 1 / -1 !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .page-layout-footer {
          width: 100% !important;
          grid-column: 1 / -1 !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .page-layout-middle {
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          flex: 1 !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .page-layout-left {
          display: flex !important;
          flex-direction: column !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 280px !important;
          max-width: 85% !important;
          height: 100% !important;
          z-index: 1000 !important;
          transform: translateX(-100%) !important;
          transition: transform 0.3s ease-in-out !important;
          box-shadow: none !important;
          overflow-y: auto !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"].sidebar-open .page-layout-left {
          transform: translateX(0) !important;
          box-shadow: 2px 0 8px rgba(0,0,0,0.15) !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .page-layout-center {
          width: 100% !important;
          flex: 1 !important;
          grid-column: 1 / -1 !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .hamburger-menu {
          display: none !important;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"] .sidebar-overlay {
          display: none;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }`,
        `#${layoutId}[data-mobile-sidebar-behavior="overlay"][data-container-mobile="true"].sidebar-open .sidebar-overlay {
          display: block !important;
        }`,
      ];
      cssRules.push(`/* Container-based overlay rules */\n${containerOverlayRules.join('\n')}`);

      // Viewport-based media query rules (fallback when ResizeObserver doesn't work as expected)
      // These apply when viewport is mobile-sized AND overlay mode is selected
      const viewportOverlayRules = `
@media (max-width: ${BREAKPOINTS.mobile.maxWidth}px) {
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] {
    display: flex !important;
    flex-direction: column !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .page-layout-header {
    width: 100% !important;
    grid-column: 1 / -1 !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .page-layout-footer {
    width: 100% !important;
    grid-column: 1 / -1 !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .page-layout-middle {
    position: relative !important;
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    flex: 1 !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .page-layout-left {
    display: flex !important;
    flex-direction: column !important;
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 280px !important;
    max-width: 85% !important;
    height: 100% !important;
    z-index: 1000 !important;
    transform: translateX(-100%) !important;
    transition: transform 0.3s ease-in-out !important;
    box-shadow: none !important;
    overflow-y: auto !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"].sidebar-open .page-layout-left {
    transform: translateX(0) !important;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15) !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .page-layout-center {
    width: 100% !important;
    flex: 1 !important;
    grid-column: 1 / -1 !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .hamburger-menu {
    display: none !important;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"] .sidebar-overlay {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    z-index: 999;
  }
  #${layoutId}[data-mobile-sidebar-behavior="overlay"].sidebar-open .sidebar-overlay {
    display: block !important;
  }
}`;
      cssRules.push(`/* Viewport-based overlay rules (fallback) */\n${viewportOverlayRules}`);
    }

    return cssRules.join('\n\n');
  };

  // Check if any slot has wrap mode for grid row calculation
  const anyMiddleSlotHasWrapMode =
    getSlotOverflow('left') === 'visible' ||
    getSlotOverflow('center') === 'visible' ||
    getSlotOverflow('right') === 'visible';

  // Build grid template based on which regions have content
  // When any middle slot has wrap mode, use 'auto' instead of '1fr' to allow expansion
  const gridTemplateRows = [
    hasHeader ? 'auto' : '',
    anyMiddleSlotHasWrapMode ? 'auto' : '1fr',
    hasFooter ? 'auto' : '',
  ].filter(Boolean).join(' ');

  // Grid columns calculation - center should always fill remaining space
  const gridTemplateColumns = (() => {
    if (!hasLeft && !hasRight) {
      return '1fr'; // No sidebars, center takes full width
    }
    if (hasLeft && !hasRight) {
      return `${leftPercent}% 1fr`; // Left sidebar + center takes rest
    }
    if (!hasLeft && hasRight) {
      return `1fr 250px`; // Center takes rest + right sidebar
    }
    // Both sidebars present
    return `${leftPercent}% 1fr 250px`;
  })();

  // Calculate grid positions based on what regions exist
  const getPreviewRegionStyle = (slot: PageLayoutSlot): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      // Overflow depends on child's heightMode:
      // - wrap: visible (slot expands with child, no scrollbar)
      // - fill/resizable: auto (scrollbar when content overflows)
      overflow: getSlotOverflow(slot),
    };

    const rowStart = hasHeader ? 2 : 1;
    const rowEnd = rowStart + 1;
    const colStart = hasLeft ? 2 : 1;
    const colEnd = colStart + 1;
    const totalCols = (hasLeft ? 1 : 0) + 1 + (hasRight ? 1 : 0);

    // Check if the slot has children with wrap mode - if so, don't force minHeight
    const headerHasWrapChild = getSlotOverflow('header') === 'visible';
    const footerHasWrapChild = getSlotOverflow('footer') === 'visible';

    switch (slot) {
      case 'header':
        return {
          ...baseStyle,
          gridRow: '1 / 2',
          gridColumn: `1 / ${totalCols + 1}`,
          // Only apply minHeight if children don't have wrap mode
          // When children have heightMode: 'wrap', header should fit content exactly
          minHeight: headerHasWrapChild ? undefined : '60px',
          position: stickyHeader ? 'sticky' : undefined,
          top: stickyHeader ? 0 : undefined,
          zIndex: stickyHeader ? 100 : undefined,
        };
      case 'footer':
        return {
          ...baseStyle,
          gridRow: `${hasHeader ? 3 : 2} / ${hasHeader ? 4 : 3}`,
          gridColumn: `1 / ${totalCols + 1}`,
          // Only apply minHeight if children don't have wrap mode
          minHeight: footerHasWrapChild ? undefined : '50px',
          position: stickyFooter ? 'sticky' : undefined,
          bottom: stickyFooter ? 0 : undefined,
          zIndex: stickyFooter ? 100 : undefined,
        };
      case 'left':
        return {
          ...baseStyle,
          gridRow: `${rowStart} / ${rowEnd}`,
          gridColumn: '1 / 2',
          // Height depends on child's heightMode:
          // - wrap: auto (slot expands with content)
          // - fill: 100% (slot fills grid cell so children can fill it)
          height: getSlotOverflow('left') === 'visible' ? 'auto' : '100%',
        };
      case 'right':
        return {
          ...baseStyle,
          gridRow: `${rowStart} / ${rowEnd}`,
          gridColumn: `${colEnd} / ${colEnd + 1}`,
          // Height depends on child's heightMode
          height: getSlotOverflow('right') === 'visible' ? 'auto' : '100%',
        };
      case 'center':
      default:
        return {
          ...baseStyle,
          gridRow: `${rowStart} / ${rowEnd}`,
          gridColumn: `${colStart} / ${colEnd}`,
          flex: 1,
          // Height depends on child's heightMode
          height: getSlotOverflow('center') === 'visible' ? 'auto' : '100%',
        };
    }
  };

  // Generate responsive CSS
  const responsiveCSS = generateResponsiveCSS();

  // Handle sticky modes: 'none', 'fixed', 'sticky'
  // - 'none': No special layout, scrolls with content (use standard grid layout)
  // - 'fixed': Header/footer always visible, middle content scrolls
  // - 'sticky': CSS position: sticky - scrolls then sticks
  const hasAnyStickyMode = effectiveHeaderMode !== 'none' || effectiveFooterMode !== 'none';
  const hasFixedMode = effectiveHeaderMode === 'fixed' || effectiveFooterMode === 'fixed';
  const hasStickyMode = effectiveHeaderMode === 'sticky' || effectiveFooterMode === 'sticky';

  if (hasAnyStickyMode) {
    // Grid columns for middle section - use 1fr for full width when no sidebars
    // When left sidebar exists but not right, center should take remaining space (1fr)
    // When both sidebars exist, use percentage-based layout
    const middleGridColumns = (() => {
      if (!hasLeft && !hasRight) {
        return '1fr'; // No sidebars, center takes full width
      }
      if (hasLeft && !hasRight) {
        return `${leftPercent}% 1fr`; // Left sidebar + center takes rest
      }
      if (!hasLeft && hasRight) {
        return `1fr 250px`; // Center takes rest + right sidebar
      }
      // Both sidebars present
      return `${leftPercent}% 1fr 250px`;
    })();

    // Toggle overlay sidebar
    const toggleOverlaySidebar = () => setIsOverlaySidebarOpen(!isOverlaySidebarOpen);
    const closeOverlaySidebar = () => setIsOverlaySidebarOpen(false);

    // Check if ANY slot has wrap mode children - if so, allow page to expand naturally
    // When any slot has wrap mode, the page should use the browser's scrollbar, not nested ones
    const leftHasWrapMode = getSlotOverflow('left') === 'visible';
    const centerHasWrapMode = getSlotOverflow('center') === 'visible';
    const rightHasWrapMode = getSlotOverflow('right') === 'visible';
    const anySlotHasWrapMode = leftHasWrapMode || centerHasWrapMode || rightHasWrapMode;

    // Determine layout strategy:
    // - 'fixed' mode: Header/footer outside scroll container (middle scrolls)
    // - 'sticky' mode: Everything inside scroll container, use CSS position: sticky
    // When wrap mode children exist, sticky behavior is limited
    const useFixedLayout = !anySlotHasWrapMode && hasFixedMode;
    const useStickyLayout = !anySlotHasWrapMode && hasStickyMode && !hasFixedMode;

    return (
      <>
        {responsiveCSS && (
          <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
        )}

        <div
          ref={containerCallbackRef}
          id={layoutId}
          className={`page-layout-container preview-mode ${isOverlaySidebarOpen ? 'sidebar-open' : ''}`}
          data-mobile-sidebar-behavior={mobileSidebarBehavior}
          data-container-mobile={isContainerMobile}
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor,
            width: '100%',
            // Layout height and overflow depends on mode:
            // - fixed: 100vh with hidden overflow (middle scrolls)
            // - sticky: 100vh with auto overflow (whole container scrolls, elements stick)
            // - wrap mode: auto height with visible overflow
            height: useFixedLayout ? '100vh' : (useStickyLayout ? '100vh' : (anySlotHasWrapMode ? 'auto' : (fullHeight ? '100vh' : 'auto'))),
            minHeight: fullHeight ? '100vh' : undefined,
            // Fixed mode: outer container doesn't scroll (middle does)
            // Sticky mode: outer container scrolls (elements stick within)
            overflow: useFixedLayout ? 'hidden' : (useStickyLayout ? 'auto' : (anySlotHasWrapMode ? 'visible' : 'auto')),
            position: 'relative',
          }}
          data-component-type="PageLayout"
        >
          {/* Header region - behavior depends on sticky mode */}
          {hasHeader && (
            <div
              className="page-layout-region page-layout-header"
              style={{
                // Fixed mode: header is outside scroll area (no position needed)
                // Sticky mode: header uses CSS sticky
                position: useStickyLayout && effectiveHeaderMode === 'sticky' ? 'sticky' : 'relative',
                top: useStickyLayout && effectiveHeaderMode === 'sticky' ? 0 : undefined,
                zIndex: effectiveHeaderMode !== 'none' ? 100 : undefined,
                width: '100%',
                flexShrink: 0,
                // Use flex for layout - don't stretch children vertically, let them size to content
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start',
                minHeight: 0,
                // Max height and scrollable header support
                maxHeight: headerMaxHeight ? `${headerMaxHeight}px` : undefined,
                overflowY: headerMaxHeight ? 'auto' : undefined,
                // Background for sticky to cover content below
                backgroundColor: useStickyLayout && effectiveHeaderMode === 'sticky' ? backgroundColor : undefined,
              }}
              data-slot="header"
            >
              {/* Hamburger menu button for overlay mode - positioned absolute within header */}
              {/* Visibility controlled entirely by CSS container queries - no inline display */}
              {mobileSidebarBehavior === 'overlay' && hasLeft && (
                <button
                  className="hamburger-menu"
                  onClick={toggleOverlaySidebar}
                  aria-label={isOverlaySidebarOpen ? 'Close menu' : 'Open menu'}
                  style={{
                    // display controlled by CSS: hidden by default, shown on mobile via container query
                    position: 'absolute',
                    top: '50%',
                    left: '8px',
                    transform: 'translateY(-50%)',
                    zIndex: 101,
                    width: '40px',
                    height: '40px',
                    minWidth: '40px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    cursor: 'pointer',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '8px',
                  }}
                >
                  {/* Hamburger icon lines */}
                  <span style={{
                    display: 'block',
                    width: '18px',
                    height: '2px',
                    backgroundColor: 'white',
                    borderRadius: '1px',
                    transition: 'transform 0.2s',
                    transform: isOverlaySidebarOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
                  }} />
                  <span style={{
                    display: 'block',
                    width: '18px',
                    height: '2px',
                    backgroundColor: 'white',
                    borderRadius: '1px',
                    opacity: isOverlaySidebarOpen ? 0 : 1,
                    transition: 'opacity 0.2s',
                  }} />
                  <span style={{
                    display: 'block',
                    width: '18px',
                    height: '2px',
                    backgroundColor: 'white',
                    borderRadius: '1px',
                    transition: 'transform 0.2s',
                    transform: isOverlaySidebarOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
                  }} />
                </button>
              )}
              {/* Header content wrapper - fills full width, height determined by content */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                // Don't stretch children - let them determine their own size
                alignItems: 'stretch', // This stretches horizontally in column layout, which is correct
              }}>
                {renderSlotChildren('header')}
              </div>
            </div>
          )}

          {/* Hamburger menu button when no header exists - shown as floating button */}
          {/* Visibility controlled entirely by CSS container queries - no inline display */}
          {mobileSidebarBehavior === 'overlay' && hasLeft && !hasHeader && (
            <button
              className="hamburger-menu"
              onClick={toggleOverlaySidebar}
              aria-label={isOverlaySidebarOpen ? 'Close menu' : 'Open menu'}
              style={{
                // display controlled by CSS: hidden by default, shown on mobile via container query
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 101,
                width: '40px',
                height: '40px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: '4px',
                padding: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <span style={{
                display: 'block',
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'transform 0.2s',
                transform: isOverlaySidebarOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none',
              }} />
              <span style={{
                display: 'block',
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                opacity: isOverlaySidebarOpen ? 0 : 1,
                transition: 'opacity 0.2s',
              }} />
              <span style={{
                display: 'block',
                width: '18px',
                height: '2px',
                backgroundColor: 'white',
                borderRadius: '1px',
                transition: 'transform 0.2s',
                transform: isOverlaySidebarOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none',
              }} />
            </button>
          )}

          {/* Middle content area with sidebar grid
              - Fixed mode: This is the scroll container (overflow: auto)
              - Sticky mode: No special overflow (outer container scrolls)
              - When container is mobile width and overlay mode, use flex layout
          */}
          <div
            className="page-layout-middle"
            style={{
              // In mobile overlay mode, don't use grid - center takes full width
              display: (isContainerMobile && mobileSidebarBehavior === 'overlay')
                ? 'flex'
                : (hasLeft || hasRight ? 'grid' : 'flex'),
              gridTemplateColumns: (isContainerMobile && mobileSidebarBehavior === 'overlay')
                ? undefined
                : (hasLeft || hasRight ? middleGridColumns : undefined),
              flexDirection: 'column',
              // flex: 1 makes this fill the remaining space between header and footer
              // minHeight: 0 allows it to shrink and enables scrolling
              flex: anySlotHasWrapMode ? '1 0 auto' : 1,
              minHeight: anySlotHasWrapMode ? undefined : 0,
              width: '100%',
              position: 'relative',
              // Fixed mode: middle scrolls (outer is hidden)
              // Sticky mode: outer scrolls (middle has no overflow)
              overflow: useFixedLayout ? 'auto' : (anySlotHasWrapMode ? 'visible' : undefined),
            }}
          >
            {/* Overlay backdrop for mobile sidebar - inside middle area */}
            {mobileSidebarBehavior === 'overlay' && hasLeft && isContainerMobile && (
              <div
                className="sidebar-overlay"
                onClick={closeOverlaySidebar}
                style={{
                  display: isOverlaySidebarOpen ? 'block' : 'none',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.5)',
                  zIndex: 999,
                  cursor: 'pointer',
                }}
              />
            )}

            {hasLeft && (
              <div
                className="page-layout-region page-layout-left"
                style={
                  // Apply overlay styles when in mobile container width and overlay mode
                  (isContainerMobile && mobileSidebarBehavior === 'overlay')
                    ? {
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '280px',
                        maxWidth: '85%',
                        height: '100%',
                        zIndex: 1000,
                        transform: isOverlaySidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                        transition: 'transform 0.3s ease-in-out',
                        boxShadow: isOverlaySidebarOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
                        overflowY: 'auto',
                        backgroundColor: backgroundColor || '#ffffff',
                      }
                    : {
                        display: 'flex',
                        flexDirection: 'column',
                        width: '100%', // Fill the grid cell
                        minWidth: 0, // Prevent overflow in grid
                        // Height depends on child's heightMode:
                        // - wrap: auto (slot expands with content)
                        // - fill: 100% (slot fills grid cell so children can fill it)
                        height: leftHasWrapMode ? 'auto' : '100%',
                        // Overflow depends on child's heightMode:
                        // - wrap: visible (slot expands with child, no scrollbar)
                        // - fill/resizable: auto (scrollbar when content overflows)
                        overflow: getSlotOverflow('left'),
                      }
                }
                data-slot="left"
              >
                {renderSlotChildren('left')}
              </div>
            )}

            <div
              className="page-layout-region page-layout-center"
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                minWidth: 0, // Prevent overflow in grid
                // Height depends on child's heightMode:
                // - wrap: auto (slot expands with content)
                // - fill: 100% (slot fills grid cell so children can fill it)
                height: centerHasWrapMode ? 'auto' : '100%',
                // When in flex layout (no sidebars) and wrap mode, use flex: 1 0 auto to expand
                // In grid layout, flex has no effect
                flex: anySlotHasWrapMode && !(hasLeft || hasRight) ? '1 0 auto' : undefined,
                // Overflow depends on child's heightMode
                overflow: getSlotOverflow('center'),
              }}
              data-slot="center"
            >
              {renderSlotChildren('center')}
            </div>

            {hasRight && (
              <div
                className="page-layout-region page-layout-right"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%', // Fill the grid cell
                  minWidth: 0, // Prevent overflow in grid
                  // Height depends on child's heightMode:
                  // - wrap: auto (slot expands with content)
                  // - fill: 100% (slot fills grid cell so children can fill it)
                  height: rightHasWrapMode ? 'auto' : '100%',
                  // Overflow depends on child's heightMode
                  overflow: getSlotOverflow('right'),
                }}
                data-slot="right"
              >
                {renderSlotChildren('right')}
              </div>
            )}
          </div>

          {/* Footer region - behavior depends on sticky mode
              - Fixed mode: footer is outside scroll area (always visible at bottom)
              - Sticky mode: footer uses CSS sticky (sticks when scrolling up)
          */}
          {hasFooter && (
            <div
              className="page-layout-region page-layout-footer"
              style={{
                // Fixed mode: footer is outside scroll area (no position needed)
                // Sticky mode: footer uses CSS sticky
                position: useStickyLayout && effectiveFooterMode === 'sticky' ? 'sticky' : 'relative',
                bottom: useStickyLayout && effectiveFooterMode === 'sticky' ? 0 : undefined,
                zIndex: effectiveFooterMode !== 'none' ? 100 : undefined,
                width: '100%',
                flexShrink: 0,
                // Background for sticky to cover content above
                backgroundColor: backgroundColor,
                display: 'flex',
                flexDirection: 'column',
                // Max height and scrollable footer support
                maxHeight: footerMaxHeight ? `${footerMaxHeight}px` : undefined,
                overflowY: footerMaxHeight ? 'auto' : undefined,
              }}
              data-slot="footer"
            >
              {renderSlotChildren('footer')}
            </div>
          )}
        </div>
      </>
    );
  }

  // Standard grid layout (no sticky elements)
  // Check if ANY slot has wrap mode children - if so, allow page to expand naturally
  const standardLeftHasWrapMode = getSlotOverflow('left') === 'visible';
  const standardCenterHasWrapMode = getSlotOverflow('center') === 'visible';
  const standardRightHasWrapMode = getSlotOverflow('right') === 'visible';
  const standardAnySlotHasWrapMode = standardLeftHasWrapMode || standardCenterHasWrapMode || standardRightHasWrapMode;

  return (
    <>
      {/* Inject responsive CSS media queries */}
      {responsiveCSS && (
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      )}

      <div
        ref={containerCallbackRef}
        id={layoutId}
        className={`page-layout-container preview-mode ${isOverlaySidebarOpen ? 'sidebar-open' : ''}`}
        data-mobile-sidebar-behavior={mobileSidebarBehavior}
        data-container-mobile={isContainerMobile}
        style={{
          // In mobile overlay mode, use flex layout instead of grid
          display: (isContainerMobile && mobileSidebarBehavior === 'overlay') ? 'flex' : 'grid',
          flexDirection: (isContainerMobile && mobileSidebarBehavior === 'overlay') ? 'column' : undefined,
          gridTemplateRows: (isContainerMobile && mobileSidebarBehavior === 'overlay') ? undefined : gridTemplateRows,
          gridTemplateColumns: (isContainerMobile && mobileSidebarBehavior === 'overlay') ? undefined : gridTemplateColumns,
          gap: '0',
          backgroundColor,
          // When any slot has wrap mode, use auto height to allow natural page expansion
          // Otherwise use minHeight for full viewport behavior
          minHeight: standardAnySlotHasWrapMode ? undefined : (fullHeight ? '100vh' : undefined),
          width: '100%',
          // When any slot has wrap mode, allow content to expand (browser handles scrolling)
          overflow: standardAnySlotHasWrapMode ? 'visible' : undefined,
          position: 'relative',
        }}
        data-component-type="PageLayout"
      >
        {hasHeader && (
          <div
            className="page-layout-region page-layout-header"
            style={getPreviewRegionStyle('header')}
            data-slot="header"
          >
            {renderSlotChildren('header')}
          </div>
        )}

        {/* Overlay backdrop for mobile sidebar */}
        {mobileSidebarBehavior === 'overlay' && hasLeft && isContainerMobile && (
          <div
            className="sidebar-overlay"
            onClick={closeOverlaySidebar}
            style={{
              display: isOverlaySidebarOpen ? 'block' : 'none',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 999,
              cursor: 'pointer',
            }}
          />
        )}

        {hasLeft && (
          <div
            className="page-layout-region page-layout-left"
            style={
              // Apply overlay styles when in mobile container width and overlay mode
              (isContainerMobile && mobileSidebarBehavior === 'overlay')
                ? {
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '280px',
                    maxWidth: '85%',
                    height: '100%',
                    zIndex: 1000,
                    transform: isOverlaySidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    boxShadow: isOverlaySidebarOpen ? '2px 0 8px rgba(0,0,0,0.15)' : 'none',
                    overflowY: 'auto',
                    backgroundColor: backgroundColor || '#ffffff',
                  }
                : getPreviewRegionStyle('left')
            }
            data-slot="left"
          >
            {renderSlotChildren('left')}
          </div>
        )}

        <div
          className="page-layout-region page-layout-center"
          style={{
            ...getPreviewRegionStyle('center'),
            // In mobile overlay mode, center takes full width
            ...(isContainerMobile && mobileSidebarBehavior === 'overlay' ? {
              gridColumn: undefined,
              width: '100%',
              flex: 1,
            } : {}),
          }}
          data-slot="center"
        >
          {renderSlotChildren('center')}
        </div>

        {hasRight && (
          <div
            className="page-layout-region page-layout-right"
            style={getPreviewRegionStyle('right')}
            data-slot="right"
          >
            {renderSlotChildren('right')}
          </div>
        )}

        {hasFooter && (
          <div
            className="page-layout-region page-layout-footer"
            style={getPreviewRegionStyle('footer')}
            data-slot="footer"
          >
            {renderSlotChildren('footer')}
          </div>
        )}
      </div>
    </>
  );
};

export default PageLayoutRenderer;
export { PageLayoutRenderer };
