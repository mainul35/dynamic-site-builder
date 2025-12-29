import React from 'react';
import type { RendererProps } from './RendererRegistry';
import NavbarRenderer from './NavbarRenderer';

/**
 * NavbarStickyRenderer - Always visible sticky header navbar
 * Fixed to the top of the viewport when scrolling
 */
const defaultNavItems = [
  { label: 'Home', href: '/', active: true },
  { label: 'About', href: '/about', active: false },
  { label: 'Services', href: '/services', active: false },
  { label: 'Contact', href: '/contact', active: false },
];

const hasNavItems = (items: unknown): boolean => {
  if (!items) return false;
  if (Array.isArray(items) && items.length > 0) return true;
  if (typeof items === 'string' && items.trim() !== '' && items !== '[]') return true;
  return false;
};

const NavbarStickyRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const navItems = hasNavItems(component.props?.navItems)
    ? component.props.navItems
    : defaultNavItems;

  const enhancedComponent = {
    ...component,
    props: {
      layout: 'default',
      brandText: 'My Site',
      sticky: true,
      ...component.props,
      navItems,
    },
    styles: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#007bff',
      padding: '0 20px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
      borderBottom: 'none',
      ...component.styles,
    },
  };

  return <NavbarRenderer component={enhancedComponent} isEditMode={isEditMode} />;
};

export default NavbarStickyRenderer;
export { NavbarStickyRenderer };
