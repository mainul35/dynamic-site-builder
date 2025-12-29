/**
 * Navbar Component Plugin - Frontend Bundle
 *
 * This is the main entry point for the navbar component plugin's frontend code.
 * It exports all renderers in a format that the main application can dynamically load.
 */

import type { PluginBundle, RendererComponent } from './types';

// Import all renderers
import NavbarRenderer from './renderers/NavbarRenderer';
import NavbarDefaultRenderer from './renderers/NavbarDefaultRenderer';
import NavbarCenteredRenderer from './renderers/NavbarCenteredRenderer';
import NavbarMinimalRenderer from './renderers/NavbarMinimalRenderer';
import NavbarDarkRenderer from './renderers/NavbarDarkRenderer';
import NavbarGlassRenderer from './renderers/NavbarGlassRenderer';
import NavbarStickyRenderer from './renderers/NavbarStickyRenderer';
import SidebarNavRenderer from './renderers/SidebarNavRenderer';
import TopHeaderBarRenderer from './renderers/TopHeaderBarRenderer';

/**
 * Plugin ID must match the Java plugin's ID
 */
export const PLUGIN_ID = 'navbar-component-plugin';

/**
 * Map of component IDs to their renderer components
 */
export const renderers: Record<string, RendererComponent> = {
  Navbar: NavbarRenderer,
  NavbarDefault: NavbarDefaultRenderer,
  NavbarCentered: NavbarCenteredRenderer,
  NavbarMinimal: NavbarMinimalRenderer,
  NavbarDark: NavbarDarkRenderer,
  NavbarGlass: NavbarGlassRenderer,
  NavbarSticky: NavbarStickyRenderer,
  SidebarNav: SidebarNavRenderer,
  TopHeaderBar: TopHeaderBarRenderer,
};

/**
 * Plugin bundle export - used by the dynamic loader
 */
export const pluginBundle: PluginBundle = {
  pluginId: PLUGIN_ID,
  renderers,
  version: '1.0.0',
};

// Also export individual renderers for direct imports
export {
  NavbarRenderer,
  NavbarDefaultRenderer,
  NavbarCenteredRenderer,
  NavbarMinimalRenderer,
  NavbarDarkRenderer,
  NavbarGlassRenderer,
  NavbarStickyRenderer,
  SidebarNavRenderer,
  TopHeaderBarRenderer,
};

// Default export is the plugin bundle
export default pluginBundle;

/**
 * Self-registration function
 * This can be called by the host application after loading the bundle
 */
export function registerRenderers(registry: {
  register: (componentId: string, renderer: RendererComponent, pluginId?: string) => void;
}): void {
  Object.entries(renderers).forEach(([componentId, renderer]) => {
    registry.register(componentId, renderer, PLUGIN_ID);
  });
  console.log(`[${PLUGIN_ID}] Registered ${Object.keys(renderers).length} renderers`);
}
