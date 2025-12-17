/**
 * TypeScript types for the visual site builder
 */

/**
 * Grid configuration for the builder canvas
 */
export interface GridConfig {
  columns: number;
  rows: string; // "auto" or specific number
  gap: string;
  minRowHeight: string;
}

/**
 * Component position within the grid
 */
export interface ComponentPosition {
  row: number;
  column: number;
  rowSpan: number;
  columnSpan: number;
}

/**
 * Component size
 */
export interface ComponentSize {
  width: string;
  height: string;
}

/**
 * Component instance on a page
 */
export interface ComponentInstance {
  instanceId: string;
  pluginId: string;
  componentId: string;
  position: ComponentPosition;
  size: ComponentSize;
  props: Record<string, any>;
  styles: Record<string, string>;
  children?: ComponentInstance[];
  zIndex?: number;
  displayOrder?: number;
  isVisible?: boolean;
}

/**
 * Global styles configuration
 */
export interface GlobalStyles {
  cssVariables: Record<string, string>;
  customCSS?: string;
}

/**
 * Complete page definition
 */
export interface PageDefinition {
  version: string;
  pageId?: number;
  pageName: string;
  grid: GridConfig;
  components: ComponentInstance[];
  globalStyles?: GlobalStyles;
}

/**
 * Component manifest from plugin
 */
export interface ComponentManifest {
  componentId: string;
  displayName: string;
  category: string;
  icon?: string;
  description?: string;
  defaultProps: Record<string, any>;
  defaultStyles: Record<string, string>;
  reactComponentPath: string;
  previewComponentPath?: string;
  configurableProps: PropDefinition[];
  configurableStyles: StyleDefinition[];
  sizeConstraints: SizeConstraints;
  pluginId: string;
  pluginVersion: string;
  canHaveChildren?: boolean;
  allowedChildTypes?: string[];
}

/**
 * Property definition
 */
export interface PropDefinition {
  name: string;
  type: PropType;
  label: string;
  defaultValue?: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  helpText?: string;
  validationPattern?: string;
}

/**
 * Property types
 */
export enum PropType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  COLOR = 'COLOR',
  IMAGE = 'IMAGE',
  URL = 'URL',
  TEXTAREA = 'TEXTAREA',
  JSON = 'JSON',
  ARRAY = 'ARRAY'
}

/**
 * Style definition
 */
export interface StyleDefinition {
  property: string;
  type: StyleType;
  label: string;
  defaultValue?: string;
  options?: string[];
  allowedUnits?: string[];
  helpText?: string;
  category?: string;
}

/**
 * Style types
 */
export enum StyleType {
  COLOR = 'COLOR',
  SIZE = 'SIZE',
  SPACING = 'SPACING',
  SELECT = 'SELECT',
  NUMBER = 'NUMBER',
  BORDER = 'BORDER',
  SHADOW = 'SHADOW',
  GRADIENT = 'GRADIENT',
  FONT_FAMILY = 'FONT_FAMILY',
  FONT_WEIGHT = 'FONT_WEIGHT',
  TEXT_ALIGN = 'TEXT_ALIGN',
  DISPLAY = 'DISPLAY',
  POSITION = 'POSITION',
  FLEX = 'FLEX',
  GRID = 'GRID'
}

/**
 * Size constraints
 */
export interface SizeConstraints {
  resizable: boolean;
  defaultWidth: string;
  defaultHeight: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  widthLocked?: boolean;
  heightLocked?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
}

/**
 * Component registry entry (from backend)
 */
export interface ComponentRegistryEntry {
  id: number;
  pluginId: string;
  componentId: string;
  componentName: string;
  category: string;
  icon?: string;
  componentManifest: string; // JSON string
  reactBundlePath?: string;
  isActive: boolean;
  registeredAt: string;
}

/**
 * Builder view mode
 */
export type ViewMode = 'edit' | 'preview';

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  pageDefinition: PageDefinition;
  timestamp: number;
  description?: string;
}
