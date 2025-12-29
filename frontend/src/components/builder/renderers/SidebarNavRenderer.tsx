import React, { useState, useMemo } from 'react';
import type { RendererProps } from './RendererRegistry';

/**
 * SidebarNavItem interface for sidebar navigation items
 */
interface SidebarNavItem {
  label: string;
  href: string;
  icon?: string;
  active?: boolean;
  children?: SidebarNavItem[];
}

/**
 * SidebarNavRenderer - Vertical sidebar navigation component
 * Features:
 * - Collapsible sidebar
 * - Icon support
 * - Nested menu items
 * - Left or right positioning
 */
const defaultSidebarNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '🏠', active: true },
  { label: 'Analytics', href: '/analytics', icon: '📊', active: false },
  { label: 'Projects', href: '/projects', icon: '📁', active: false },
  { label: 'Settings', href: '/settings', icon: '⚙️', active: false },
];

const hasNavItems = (items: unknown): boolean => {
  if (!items) return false;
  if (Array.isArray(items) && items.length > 0) return true;
  if (typeof items === 'string' && items.trim() !== '' && items !== '[]') return true;
  return false;
};

const SidebarNavRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const props = component.props || {};
  const brandText = (props.brandText as string) || 'Menu';
  const brandImageUrl = (props.brandImageUrl as string) || '';
  const brandLink = (props.brandLink as string) || '/';
  const propsNavItems = props.navItems;
  const collapsed = Boolean(props.collapsed);
  const collapsible = props.collapsible !== false;
  const position = (props.position as string) || 'left';
  const showIcons = props.showIcons !== false;

  const navItems = hasNavItems(propsNavItems) ? propsNavItems : defaultSidebarNavItems;

  const {
    backgroundColor = '#2c3e50',
    textColor = '#ecf0f1',
    accentColor = '#3498db',
    width = '250px',
    collapsedWidth = '60px',
    padding = '20px 0',
    boxShadow = '2px 0 10px rgba(0,0,0,0.1)',
    fontFamily = 'inherit',
    fontSize = '14px',
  } = component.styles as Record<string, string>;

  React.useEffect(() => {
    setIsCollapsed(collapsed);
  }, [collapsed]);

  const parsedNavItems: SidebarNavItem[] = useMemo(() => {
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

  const toggleExpanded = (itemLabel: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemLabel)) {
        newSet.delete(itemLabel);
      } else {
        newSet.add(itemLabel);
      }
      return newSet;
    });
  };

  const containerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: isCollapsed ? collapsedWidth : width,
    height: '100%',
    minHeight: '400px',
    backgroundColor,
    color: textColor,
    padding,
    boxShadow: position === 'left' ? boxShadow : `-2px 0 10px rgba(0,0,0,0.1)`,
    fontFamily,
    fontSize,
    boxSizing: 'border-box',
    transition: 'width 0.3s ease',
    overflow: 'hidden',
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'space-between',
    padding: '0 16px 20px 16px',
    borderBottom: `1px solid rgba(255,255,255,0.1)`,
    marginBottom: '10px',
  };

  const brandStyles: React.CSSProperties = {
    display: isCollapsed ? 'none' : 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: textColor,
    fontWeight: 600,
    fontSize: '1.1em',
    cursor: isEditMode ? 'default' : 'pointer',
  };

  const toggleButtonStyles: React.CSSProperties = {
    display: collapsible ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '6px',
    color: textColor,
    cursor: 'pointer',
    transition: 'background 0.2s ease',
  };

  const navListStyles: React.CSSProperties = {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    flex: 1,
    overflowY: 'auto',
  };

  const getItemStyles = (item: SidebarNavItem, level = 0): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: isCollapsed ? '0' : '12px',
    padding: isCollapsed ? '12px' : `12px 16px 12px ${16 + level * 16}px`,
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    textDecoration: 'none',
    color: item.active ? accentColor : textColor,
    backgroundColor: item.active ? 'rgba(255,255,255,0.1)' : 'transparent',
    borderLeft: item.active && !isCollapsed ? `3px solid ${accentColor}` : '3px solid transparent',
    transition: 'all 0.2s ease',
    cursor: isEditMode ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
  });

  const iconStyles: React.CSSProperties = {
    fontSize: '1.2em',
    width: '24px',
    textAlign: 'center',
    flexShrink: 0,
  };

  const labelStyles: React.CSSProperties = {
    display: isCollapsed ? 'none' : 'block',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const expandArrowStyles: React.CSSProperties = {
    display: isCollapsed ? 'none' : 'block',
    fontSize: '10px',
    transition: 'transform 0.2s ease',
  };

  const handleNavClick = (e: React.MouseEvent, item: SidebarNavItem) => {
    if (isEditMode) {
      e.preventDefault();
      return;
    }

    if (item.children && item.children.length > 0) {
      e.preventDefault();
      toggleExpanded(item.label);
      return;
    }
  };

  const handleBrandClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
    }
  };

  const renderNavItem = (item: SidebarNavItem, index: number, level = 0): React.ReactNode => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.label);

    return (
      <li key={`${item.label}-${index}`}>
        <a
          href={item.href || '#'}
          style={getItemStyles(item, level)}
          onClick={(e) => handleNavClick(e, item)}
          onMouseEnter={(e) => {
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isEditMode) {
              (e.currentTarget as HTMLElement).style.backgroundColor = item.active ? 'rgba(255,255,255,0.1)' : 'transparent';
            }
          }}
          title={isCollapsed ? item.label : undefined}
        >
          {showIcons && item.icon && (
            <span style={iconStyles}>{item.icon}</span>
          )}
          <span style={labelStyles}>{item.label}</span>
          {hasChildren && (
            <span style={{
              ...expandArrowStyles,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}>
              ▼
            </span>
          )}
        </a>

        {hasChildren && isExpanded && !isCollapsed && (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {item.children!.map((child, childIndex) =>
              renderNavItem(child, childIndex, level + 1)
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <nav style={containerStyles}>
      <div style={headerStyles}>
        <a href={brandLink} style={brandStyles} onClick={handleBrandClick}>
          {brandImageUrl && (
            <img
              src={brandImageUrl}
              alt={brandText || 'Logo'}
              style={{ height: '24px', width: 'auto' }}
            />
          )}
          {brandText && <span>{brandText}</span>}
        </a>
        {collapsible && (
          <button
            style={toggleButtonStyles}
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? '▶' : '◀'}
          </button>
        )}
      </div>

      <ul style={navListStyles}>
        {parsedNavItems.map((item, index) => renderNavItem(item, index))}
      </ul>

      {parsedNavItems.length === 0 && isEditMode && (
        <div style={{
          color: 'rgba(255,255,255,0.5)',
          fontStyle: 'italic',
          padding: '16px',
          textAlign: 'center',
        }}>
          Add navigation items in Properties panel
        </div>
      )}
    </nav>
  );
};

export default SidebarNavRenderer;
export { SidebarNavRenderer };
