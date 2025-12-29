import React from 'react';
import type { RendererProps } from '../types';
import NavbarRenderer from './NavbarRenderer';

/**
 * NavbarCenteredRenderer - Centered navbar layout
 * Brand and navigation links centered in the navbar
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

const NavbarCenteredRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const navItems = hasNavItems(component.props?.navItems)
    ? component.props.navItems
    : defaultNavItems;

  const enhancedComponent = {
    ...component,
    props: {
      layout: 'centered',
      brandText: 'My Site',
      ...component.props,
      navItems,
    },
    styles: {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#007bff',
      padding: '0 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      borderBottom: '1px solid #f0f0f0',
      ...component.styles,
    },
  };

  return <NavbarRenderer component={enhancedComponent} isEditMode={isEditMode} />;
};

export default NavbarCenteredRenderer;
export { NavbarCenteredRenderer };
