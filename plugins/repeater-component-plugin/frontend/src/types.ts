/**
 * Type definitions for repeater plugin renderers.
 */

export interface ComponentPosition {
  x: number;
  y: number;
}

export interface ComponentSize {
  width: string;
  height: string;
}

export interface DataSourceConfig {
  type: 'api' | 'static' | 'context';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  staticData?: unknown[];
}

export interface IteratorConfig {
  dataPath?: string;
  itemAlias?: string;
  indexAlias?: string;
  keyPath?: string;
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
  dataSource?: DataSourceConfig;
  iteratorConfig?: IteratorConfig;
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

/**
 * Data context for resolving template variables
 */
export interface DataContext {
  dataSources?: Record<string, unknown>;
  item?: unknown;
  index?: number;
  sharedData?: Record<string, unknown>;
  user?: unknown;
  [key: string]: unknown;
}
