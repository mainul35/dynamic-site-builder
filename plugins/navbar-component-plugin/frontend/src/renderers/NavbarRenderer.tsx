import React, { useState, useEffect, useMemo } from 'react';
import type { RendererProps, NavItem } from '../types';

/**
 * NavbarRenderer - Renders a navigation bar component
 * Supports multiple layouts, responsive design, multi-level dropdowns, and customizable styling
 */
const NavbarRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  // Extract props with defaults
  const props = component.props || {};
  const brandText = (props.brandText as string) || 'My Site';
  const brandImageUrl = (props.brandImageUrl as string) || '';
  const brandLink = (props.brandLink as string) || '/';
  const logoType = (props.logoType as string) || 'text';
  const logoHeight = (props.logoHeight as string) || '32px';
  const logoWidth = (props.logoWidth as string) || 'auto';
  const navItems = props.navItems || [];
  const layout = (props.layout as string) || 'default';
  const sticky = Boolean(props.sticky);
  const showMobileMenu = props.showMobileMenu !== false;
  const mobileBreakpoint = (props.mobileBreakpoint as string) || '768px';

  // Parse navItems if it's a string (JSON)
  const parsedNavItems: NavItem[] = useMemo(() => {
    if (typeof navItems === 'string') {
      try {
        return JSON.parse(navItems);
      } catch (e) {
        console.warn('Failed to parse navItems:', e);
        return [];
      }
    }
    return Array.isArray(navItems) ? navItems : [];
  }, [navItems]);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      const breakpoint = parseInt(mobileBreakpoint as string) || 768;
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileBreakpoint]);

  // Close mobile menu when switching to desktop
  useEffect(() => {
    if (!isMobile) {
      setIsMobileMenuOpen(false);
      setOpenDropdowns(new Set());
    }
  }, [isMobile]);

  // Extract style props from component.styles
  const {
    backgroundColor = '#ffffff',
    textColor = '#333333',
    accentColor = '#007bff',
    padding = '0 20px',
    boxShadow = '0 2px 4px rgba(0,0,0,0.1)',
    borderBottom = '1px solid #e0e0e0',
    fontFamily = 'inherit',
    fontSize = '16px',
    dropdownBg = '#ffffff',
    dropdownShadow = '0 4px 12px rgba(0,0,0,0.15)',
    backdropFilter,
    WebkitBackdropFilter,
  } = component.styles as Record<string, string>;

  // Get justify-content based on layout
  const getJustifyContent = (): string => {
    switch (layout) {
      case 'centered':
        return 'center';
      case 'split':
        return 'space-between';
      case 'minimal':
        return 'flex-start';
      case 'default':
      default:
        return 'space-between';
    }
  };

  // Toggle dropdown
  const toggleDropdown = (itemLabel: string) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel);
      } else {
        newSet.add(itemLabel);
      }
      return newSet;
    });
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setOpenDropdowns(new Set());
  };

  // Container styles
  const containerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: getJustifyContent(),
    width: '100%',
    minHeight: '40px',
    backgroundColor,
    color: textColor,
    padding,
    boxShadow,
    borderBottom,
    fontFamily,
    fontSize,
    boxSizing: 'border-box',
    position: sticky ? 'sticky' : 'relative',
    top: sticky ? 0 : 'auto',
    zIndex: sticky ? 1000 : 'auto',
    transition: 'all 0.3s ease',
    backdropFilter: backdropFilter || undefined,
    WebkitBackdropFilter: WebkitBackdropFilter || undefined,
  };

  // Brand styles
  const brandStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: textColor,
    fontWeight: 600,
    fontSize: '1.25em',
    cursor: isEditMode ? 'default' : 'pointer',
  };

  // Nav list styles
  const navListStyles: React.CSSProperties = {
    display: isMobile && showMobileMenu ? (isMobileMenuOpen ? 'flex' : 'none') : 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    gap: isMobile ? '0' : '8px',
    listStyle: 'none',
    margin: 0,
    padding: isMobile ? '10px 0' : 0,
    position: isMobile ? 'absolute' : 'static',
    top: isMobile ? '100%' : 'auto',
    left: 0,
    right: 0,
    backgroundColor: isMobile ? backgroundColor : 'transparent',
    boxShadow: isMobile && isMobileMenuOpen ? '0 4px 6px rgba(0,0,0,0.1)' : 'none',
    zIndex: 999,
  };

  // Get nav link styles
  const getLinkStyles = (item: NavItem, isDropdownItem = false): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '12px 20px' : (isDropdownItem ? '10px 16px' : '8px 12px'),
    textDecoration: 'none',
    color: item.active ? accentColor : textColor,
    fontWeight: item.active ? 600 : 400,
    borderBottom: !isMobile && !isDropdownItem && item.active ? `2px solid ${accentColor}` : '2px solid transparent',
    transition: 'all 0.2s ease',
    cursor: isEditMode ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
    width: isMobile || isDropdownItem ? '100%' : 'auto',
    boxSizing: 'border-box',
  });

  // Dropdown container styles
  const getDropdownStyles = (isOpen: boolean): React.CSSProperties => ({
    display: isOpen ? 'block' : 'none',
    position: isMobile ? 'static' : 'absolute',
    top: isMobile ? 'auto' : '100%',
    left: isMobile ? 'auto' : 0,
    minWidth: '200px',
    backgroundColor: dropdownBg || backgroundColor,
    boxShadow: isMobile ? 'none' : dropdownShadow,
    borderRadius: isMobile ? 0 : '8px',
    padding: isMobile ? '0 0 0 20px' : '8px 0',
    margin: 0,
    listStyle: 'none',
    zIndex: 1000,
    overflow: 'hidden',
  });

  // Nav item wrapper styles
  const navItemWrapperStyles: React.CSSProperties = {
    position: 'relative',
    display: isMobile ? 'block' : 'inline-block',
  };

  // Hamburger button styles
  const hamburgerStyles: React.CSSProperties = {
    display: isMobile && showMobileMenu ? 'flex' : 'none',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '24px',
    height: '20px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  };

  // Hamburger line styles
  const hamburgerLineBase: React.CSSProperties = {
    width: '24px',
    height: '3px',
    backgroundColor: textColor,
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  };

  // Dropdown arrow styles
  const dropdownArrowStyles: React.CSSProperties = {
    marginLeft: '6px',
    fontSize: '10px',
    transition: 'transform 0.2s ease',
  };

  // Handle nav item click
  const handleNavClick = (e: React.MouseEvent, item: NavItem) => {
    if (isEditMode) {
      e.preventDefault();
      return;
    }

    if (item.children && item.children.length > 0) {
      e.preventDefault();
      toggleDropdown(item.label);
      return;
    }

    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
    closeAllDropdowns();
  };

  // Handle brand click
  const handleBrandClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
    }
  };

  // Render a navigation item (recursive for multi-level)
  const renderNavItem = (item: NavItem, index: number, level = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openDropdowns.has(item.label);
    const isDropdownItem = level > 0;

    return (
      <li key={`${item.label}-${index}`} style={navItemWrapperStyles}>
        <a
          href={item.href || '#'}
          style={getLinkStyles(item, isDropdownItem)}
          onClick={(e) => handleNavClick(e, item)}
          onMouseEnter={(e) => {
            if (!isEditMode && !isMobile && hasChildren) {
              setOpenDropdowns(prev => new Set(prev).add(item.label));
            }
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.color = accentColor;
              (e.currentTarget as HTMLElement).style.backgroundColor = isMobile || isDropdownItem ? '#f5f5f5' : 'transparent';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.color = item.active ? accentColor : textColor;
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }
          }}
        >
          <span>{item.label}</span>
          {hasChildren && (
            <span style={{
              ...dropdownArrowStyles,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▼
            </span>
          )}
        </a>

        {hasChildren && (
          <ul
            style={getDropdownStyles(isOpen)}
            onMouseLeave={() => {
              if (!isMobile) {
                setOpenDropdowns(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(item.label);
                  return newSet;
                });
              }
            }}
          >
            {item.children!.map((child, childIndex) =>
              renderNavItem(child, childIndex, level + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  // Determine what to show based on logoType
  const showLogo = (logoType === 'image' || logoType === 'both') && brandImageUrl;
  const showText = (logoType === 'text' || logoType === 'both') || (!brandImageUrl && logoType === 'image');

  // Logo image styles
  const logoImageStyles: React.CSSProperties = {
    height: logoHeight || '32px',
    width: logoWidth || 'auto',
    objectFit: 'contain',
  };

  return (
    <nav style={containerStyles}>
      {/* Brand/Logo */}
      <a href={brandLink} style={brandStyles} onClick={handleBrandClick}>
        {showLogo && (
          <img
            src={brandImageUrl}
            alt={brandText || 'Logo'}
            style={logoImageStyles}
          />
        )}
        {showText && brandText && <span>{brandText}</span>}
      </a>

      {/* Spacer for split layout */}
      {layout === 'split' && <div style={{ flex: 1 }} />}

      {/* Navigation Links */}
      {parsedNavItems.length > 0 && (
        <ul style={navListStyles}>
          {parsedNavItems.map((item, index) => renderNavItem(item, index))}
        </ul>
      )}

      {/* Mobile Menu Button */}
      {showMobileMenu && (
        <button
          style={hamburgerStyles}
          onClick={() => {
            setIsMobileMenuOpen(!isMobileMenuOpen);
            if (isMobileMenuOpen) {
              closeAllDropdowns();
            }
          }}
          aria-label="Toggle navigation menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span
            style={{
              ...hamburgerLineBase,
              transform: isMobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }}
          />
          <span
            style={{
              ...hamburgerLineBase,
              opacity: isMobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              ...hamburgerLineBase,
              transform: isMobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none',
            }}
          />
        </button>
      )}

      {/* Empty state for edit mode */}
      {parsedNavItems.length === 0 && isEditMode && (
        <span style={{ color: '#999', fontStyle: 'italic', marginLeft: 'auto' }}>
          Add navigation items in Properties panel
        </span>
      )}
    </nav>
  );
};

export default NavbarRenderer;
export { NavbarRenderer };
