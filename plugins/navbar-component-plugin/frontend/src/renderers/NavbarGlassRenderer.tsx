import React from 'react';
import type { RendererProps } from '../types';
import NavbarRenderer from './NavbarRenderer';

/**
 * NavbarGlassRenderer - Glassmorphism style navbar
 * Translucent background with blur effect
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

const NavbarGlassRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
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
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      textColor: '#333333',
      accentColor: '#6366f1',
      padding: '0 24px',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      ...component.styles,
    },
  };

  return <NavbarRenderer component={enhancedComponent} isEditMode={isEditMode} />;
};

export default NavbarGlassRenderer;
export { NavbarGlassRenderer };
