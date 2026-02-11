import React, { useState, useCallback, useMemo } from 'react';
import type { RendererProps } from '../types';

/**
 * Navigation item interface
 */
interface NavItem {
  label: string;
  href: string;
  active?: boolean;
}

/**
 * Default nav items for demo/edit mode
 */
const defaultNavItems: NavItem[] = [
  { label: 'Home', href: '/', active: true },
  { label: 'About', href: '/about', active: false },
  { label: 'Services', href: '/services', active: false },
  { label: 'Contact', href: '/contact', active: false },
];

/**
 * Parse items from props (handles JSON strings and arrays)
 */
const parseItems = <T,>(items: unknown, defaultItems: T[]): T[] => {
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultItems;
    } catch {
      return defaultItems;
    }
  }
  return Array.isArray(items) && items.length > 0 ? items : defaultItems;
};

/**
 * MobileNavbarRenderer - Brand + Hamburger + Nav Items
 *
 * Structure:
 * ┌──────────────────────────────────────────┐
 * │           My Site (Brand)                │
 * ├──────────────────────────────────────────┤
 * │      │   Home                            │
 * │  ☰   │   About                           │
 * │      │   Contact                         │
 * └──────────────────────────────────────────┘
 *
 * When hamburger is clicked, dispatches event to toggle PageLayout sidebar.
 */
const MobileNavbarRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const props = component.props || {};

  // Brand props
  const brandText = (props.brandText as string) || 'My Site';
  const brandImageUrl = (props.brandImageUrl as string) || '';
  const brandLink = (props.brandLink as string) || '/';
  const logoType = (props.logoType as string) || 'text';
  const logoHeight = (props.logoHeight as string) || '32px';
  const logoWidth = (props.logoWidth as string) || 'auto';

  // Parse nav items
  const navItems = useMemo(() =>
    parseItems<NavItem>(props.navItems, defaultNavItems),
    [props.navItems]
  );

  // Styles from component
  const {
    backgroundColor = '#ffffff',
    textColor = '#333333',
    accentColor = '#007bff',
    menuIconColor = '#333333',
    fontFamily = 'inherit',
    fontSize = '14px',
    padding = '8px 16px',
  } = component.styles as Record<string, string>;

  // Toggle menu and dispatch event for parent layout
  const handleMenuToggle = useCallback(() => {
    if (isEditMode) return;

    const newState = !menuOpen;
    setMenuOpen(newState);

    // Dispatch custom event that PageLayout can listen to
    const event = new CustomEvent('mobile-navbar-toggle', {
      bubbles: true,
      detail: {
        isOpen: newState,
        instanceId: component.instanceId,
      },
    });
    document.dispatchEvent(event);
  }, [isEditMode, menuOpen, component.instanceId]);

  // Handle link clicks
  const handleLinkClick = useCallback((e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
    }
  }, [isEditMode]);

  // Determine what to show based on logoType
  const showLogo = (logoType === 'image' || logoType === 'both') && brandImageUrl;
  const showText = (logoType === 'text' || logoType === 'both') || (!brandImageUrl && logoType === 'image');
  const hasBrand = showLogo || (showText && brandText);

  // Styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    backgroundColor,
    color: textColor,
    fontFamily,
    fontSize,
    boxSizing: 'border-box',
  };

  const brandSectionStyles: React.CSSProperties = {
    display: hasBrand ? 'flex' : 'none',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
  };

  const brandStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: textColor,
    fontWeight: 600,
    fontSize: '1.2em',
    cursor: isEditMode ? 'default' : 'pointer',
  };

  const logoImageStyles: React.CSSProperties = {
    height: logoHeight || '32px',
    width: logoWidth || 'auto',
    objectFit: 'contain',
  };

  const navRowStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    padding,
    gap: '12px',
  };

  const menuButtonStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '36px',
    height: '36px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: isEditMode ? 'default' : 'pointer',
    color: menuIconColor,
    transition: 'background-color 0.2s ease',
    flexShrink: 0,
    padding: 0,
  };

  // Nav items container - stacked vertically
  const navItemsStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    flex: 1,
  };

  const getNavLinkStyles = (item: NavItem): React.CSSProperties => ({
    display: 'inline-block',
    padding: '6px 0',
    textDecoration: 'none',
    color: item.active ? accentColor : textColor,
    fontWeight: item.active ? 600 : 400,
    borderBottom: item.active ? `2px solid ${accentColor}` : '2px solid transparent',
    transition: 'all 0.2s ease',
    cursor: isEditMode ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
  });

  // Hamburger icon (3 lines)
  const HamburgerIcon = () => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );

  return (
    <div style={containerStyles}>
      {/* Brand/Logo Section */}
      {hasBrand && (
        <div style={brandSectionStyles}>
          <a href={brandLink} style={brandStyles} onClick={handleLinkClick}>
            {showLogo && (
              <img
                src={brandImageUrl}
                alt={brandText || 'Logo'}
                style={logoImageStyles}
              />
            )}
            {showText && brandText && <span>{brandText}</span>}
          </a>
        </div>
      )}

      {/* Navigation Row: Hamburger + Nav Items */}
      <div style={navRowStyles}>
        {/* Left: Hamburger */}
        <button
          style={menuButtonStyles}
          onClick={handleMenuToggle}
          onMouseEnter={(e) => {
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
          title={menuOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-label={menuOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-expanded={menuOpen}
        >
          <HamburgerIcon />
        </button>

        {/* Right: Nav Items stacked vertically */}
        <div style={navItemsStyles}>
          {navItems.map((item, index) => (
            <a
              key={`${item.label}-${index}`}
              href={item.href || '#'}
              style={getNavLinkStyles(item)}
              onClick={handleLinkClick}
              onMouseEnter={(e) => {
                if (!isEditMode) {
                  (e.currentTarget as HTMLElement).style.color = accentColor;
                }
              }}
              onMouseLeave={(e) => {
                if (!isEditMode) {
                  (e.currentTarget as HTMLElement).style.color = item.active ? accentColor : textColor;
                }
              }}
            >
              {item.label}
            </a>
          ))}

          {/* Empty nav state for edit mode */}
          {navItems.length === 0 && isEditMode && (
            <span style={{ color: '#999', fontStyle: 'italic' }}>
              Add navigation items in Properties panel
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileNavbarRenderer;
export { MobileNavbarRenderer };
