import React from 'react';
import type { RendererProps } from './RendererRegistry';
import NavbarRenderer from './NavbarRenderer';

/**
 * NavbarDarkRenderer - Dark theme navbar
 * Dark background with light text
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

const NavbarDarkRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const navItems = hasNavItems(component.props?.navItems)
    ? component.props.navItems
    : defaultNavItems;

  const enhancedComponent = {
    ...component,
    props: {
      layout: 'default',
      brandText: 'My Site',
      ...component.props,
      navItems,
    },
    styles: {
      backgroundColor: '#1a1a2e',
      textColor: '#ffffff',
      accentColor: '#4dabf7',
      padding: '0 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      borderBottom: 'none',
      dropdownBg: '#16213e',
      dropdownShadow: '0 4px 16px rgba(0,0,0,0.4)',
      ...component.styles,
    },
  };

  return <NavbarRenderer component={enhancedComponent} isEditMode={isEditMode} />;
};

export default NavbarDarkRenderer;
export { NavbarDarkRenderer };
