/**
 * Button Component Plugin - Frontend Bundle
 */

import type { PluginBundle, RendererComponent } from './types';
import ButtonRenderer from './renderers/ButtonRenderer';

export const PLUGIN_ID = 'button-component-plugin';

export const renderers: Record<string, RendererComponent> = {
  Button: ButtonRenderer,
};

export const pluginBundle: PluginBundle = {
  pluginId: PLUGIN_ID,
  renderers,
  version: '1.0.0',
};

export { ButtonRenderer };

export default pluginBundle;

export function registerRenderers(registry: {
  register: (componentId: string, renderer: RendererComponent, pluginId?: string) => void;
}): void {
  Object.entries(renderers).forEach(([componentId, renderer]) => {
    registry.register(componentId, renderer, PLUGIN_ID);
  });
  console.log(`[${PLUGIN_ID}] Registered ${Object.keys(renderers).length} renderers`);
}
