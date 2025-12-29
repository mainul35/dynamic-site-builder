/**
 * Textbox Component Plugin - Frontend Bundle
 */

import type { PluginBundle, RendererComponent } from './types';
import TextboxRenderer from './renderers/TextboxRenderer';

export const PLUGIN_ID = 'textbox-component-plugin';

export const renderers: Record<string, RendererComponent> = {
  Textbox: TextboxRenderer,
};

export const pluginBundle: PluginBundle = {
  pluginId: PLUGIN_ID,
  renderers,
  version: '1.0.0',
};

export { TextboxRenderer };

export default pluginBundle;

export function registerRenderers(registry: {
  register: (componentId: string, renderer: RendererComponent, pluginId?: string) => void;
}): void {
  Object.entries(renderers).forEach(([componentId, renderer]) => {
    registry.register(componentId, renderer, PLUGIN_ID);
  });
  console.log(`[${PLUGIN_ID}] Registered ${Object.keys(renderers).length} renderers`);
}
