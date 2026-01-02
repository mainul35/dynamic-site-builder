/**
 * Type definitions for plugin renderers.
 */

import type React from 'react';

export interface ComponentPosition {
  x: number;
  y: number;
}

export interface ComponentSize {
  width: string;
  height: string;
}

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

export interface RendererProps {
  component: ComponentInstance;
  isEditMode: boolean;
}

export type RendererComponent = React.FC<RendererProps>;

export interface PluginBundle {
  pluginId: string;
  renderers: Record<string, RendererComponent>;
  styles?: string;
  version?: string;
}
