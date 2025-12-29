/**
 * Type definitions for plugin renderers.
 * These mirror the types from the main frontend but are self-contained
 * so the plugin can be built independently.
 */

/**
 * Position of a component on the canvas
 */
export interface ComponentPosition {
  x: number;
  y: number;
}

/**
 * Size of a component
 */
export interface ComponentSize {
  width: number;
  height: number;
}

/**
 * A component instance placed on the canvas
 */
export interface ComponentInstance {
  instanceId: string;
  pluginId: string;
  componentId: string;
  componentCategory?: string;
  parentId?: string | null;
  position: ComponentPosition;
  size: ComponentSize;
  props: Record<string, unknown>;
  styles: Record<string, string>;
  children?: ComponentInstance[];
  zIndex?: number;
  displayOrder?: number;
  isVisible?: boolean;
  reactBundlePath?: string;
}

/**
 * Props passed to all renderer components
 */
export interface RendererProps {
  component: ComponentInstance;
  isEditMode: boolean;
}

/**
 * Type for a renderer component
 */
export type RendererComponent = React.FC<RendererProps>;

/**
 * Plugin bundle export interface
 * Each plugin must export an object conforming to this interface
 */
export interface PluginBundle {
  /**
   * Plugin identifier
   */
  pluginId: string;

  /**
   * Map of componentId to renderer component
   */
  renderers: Record<string, RendererComponent>;

  /**
   * Optional CSS to inject
   */
  styles?: string;

  /**
   * Plugin version
   */
  version?: string;
}

/**
 * Navigation item with multi-level support
 */
export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  children?: NavItem[];
}
