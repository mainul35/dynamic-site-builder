import React from 'react';
import type { RendererProps } from '../types';
import NavbarRenderer from './NavbarRenderer';

/**
 * NavbarDefaultRenderer - Default navbar layout
 * Brand on left, navigation links on right
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

const NavbarDefaultRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
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
      backgroundColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#007bff',
      padding: '0 20px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderBottom: '1px solid #e0e0e0',
      ...component.styles,
    },
  };

  return <NavbarRenderer component={enhancedComponent} isEditMode={isEditMode} />;
};

export default NavbarDefaultRenderer;
export { NavbarDefaultRenderer };
