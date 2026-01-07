/**
 * TypeScript types for the visual site builder
 */

// ============================================================
// DATA BINDING TYPES (Phase 1: Data Binding Infrastructure)
// ============================================================

/**
 * Data source types supported by the system
 */
export type DataSourceType = 'api' | 'context' | 'static';

/**
 * Field mapping configuration for transforming API responses
 */
export interface FieldMappingConfig {
  /** JSON path to extract value (e.g., "data.items", "response.user.name") */
  path: string;
  /** Optional transform: "uppercase", "lowercase", "date", "currency", etc. */
  transform?: string;
  /** Default value if path not found */
  fallback?: any;
}

/**
 * Field mapping - maps API response fields to component props
 */
export interface FieldMapping {
  [propName: string]: string | FieldMappingConfig;
}

/**
 * Data source configuration for a component
 */
export interface DataSourceConfig {
  /** Type of data source */
  type: DataSourceType;
  /** API endpoint (e.g., "/api/products") - for 'api' type */
  endpoint?: string;
  /** HTTP method for API calls */
  method?: 'GET' | 'POST';
  /** Custom headers for API calls */
  headers?: Record<string, string>;
  /** Map API fields to component props */
  fieldMapping?: FieldMapping;
  /** Events that trigger refresh */
  refreshOn?: string[];
  /** Cache key for response caching */
  cacheKey?: string;
  /** Cache TTL in milliseconds */
  cacheTtlMs?: number;
  /** Static data - for 'static' type */
  staticData?: any;
  /** Context key - for 'context' type */
  contextKey?: string;
}

/**
 * Iterator configuration for data iteration components
 */
export interface IteratorConfig {
  /** Path to array in data (e.g., "items", "data.products") */
  dataPath: string;
  /** Variable name for current item (e.g., "item") */
  itemAlias: string;
  /** Variable name for index (e.g., "index") */
  indexAlias?: string;
  /** Path to unique key for React keys */
  keyPath?: string;
  /** Components to show when array is empty */
  emptyTemplate?: ComponentInstance[];
}

/**
 * Page-level data context configuration
 */
export interface PageDataContext {
  /** Named data sources that can be referenced by components */
  dataSources: {
    [key: string]: DataSourceConfig;
  };
  /** Data shared between components */
  sharedData?: {
    [key: string]: any;
  };
}

/**
 * Template binding for dynamic content
 * Maps component props to template variables (e.g., {{user.name}})
 */
export interface TemplateBindings {
  [propName: string]: string;
}

// ============================================================
// CORE BUILDER TYPES
// ============================================================

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
 * Event action types for UI-based configuration
 */
export enum ActionType {
  NONE = 'none',
  NAVIGATE = 'navigate',
  SHOW_MESSAGE = 'showMessage',
  TOGGLE_VISIBILITY = 'toggleVisibility',
  UPDATE_PROP = 'updateProp',
  SUBMIT_FORM = 'submitForm',
  OPEN_MODAL = 'openModal',
  CLOSE_MODAL = 'closeModal',
  CUSTOM_CODE = 'customCode',
  CALL_API = 'callApi',
  EMIT_EVENT = 'emitEvent',
}

/**
 * Event action configuration
 */
export interface EventAction {
  type: ActionType;
  config: Record<string, any>;
}

/**
 * Event configuration for a component
 */
export interface ComponentEventConfig {
  /** The event type (e.g., 'onClick', 'onHover', 'onSubmit') */
  eventType: string;
  /** Simple action configured via UI */
  action?: EventAction;
  /** Custom JavaScript code for advanced handlers */
  customCode?: string;
  /** Prevent default browser behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
  /** Only execute in preview mode (not edit mode) */
  previewOnly?: boolean;
}

/**
 * Component category types
 */
export type ComponentCategory = 'layout' | 'ui' | 'navigation' | 'form' | 'media' | 'data';

/**
 * Component instance on a page
 */
export interface ComponentInstance {
  instanceId: string;
  pluginId: string;
  componentId: string;
  /** Category of the component (layout, ui, navigation, etc.) */
  componentCategory?: ComponentCategory;
  /** Parent component ID for nested components */
  parentId?: string | null;
  position: ComponentPosition;
  size: ComponentSize;
  props: Record<string, any>;
  styles: Record<string, string>;
  children?: ComponentInstance[];
  zIndex?: number;
  displayOrder?: number;
  isVisible?: boolean;
  /** Event configurations for this component instance */
  events?: ComponentEventConfig[];
  /** Path to the React bundle for dynamic loading (from plugin) */
  reactBundlePath?: string;
  // Data binding properties (Phase 1)
  /** Data source configuration for this component */
  dataSource?: DataSourceConfig;
  /** Template bindings for dynamic content (e.g., { "text": "{{user.name}}" }) */
  templateBindings?: TemplateBindings;
  /** Iterator configuration for data iteration components */
  iteratorConfig?: IteratorConfig;
  /** Reference to a named data source in PageDataContext */
  dataSourceRef?: string;
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
  /** Page-level data sources and context (Phase 1) */
  dataContext?: PageDataContext;
}

/**
 * Component capabilities that drive behavior in the builder
 *
 * Instead of hardcoding component IDs in the core application,
 * capabilities allow plugins to declare their behavior declaratively.
 * The core application reads these capabilities and adapts accordingly.
 */
export interface ComponentCapabilities {
  /**
   * Component can contain child components (enables drag-drop children)
   * When true, the component is treated as a container in the builder UI
   */
  canHaveChildren?: boolean;

  /**
   * Component supports data source configuration
   * When true, shows the Data Source Editor in the Properties Panel
   */
  hasDataSource?: boolean;

  /**
   * Component should use auto-height sizing
   * When true, height adjusts automatically to content
   */
  autoHeight?: boolean;

  /**
   * Component is a layout container (affects drag-drop behavior)
   * When true, other components can be dropped inside
   */
  isContainer?: boolean;

  /**
   * Component supports data iteration (like repeating over arrays)
   * When true, enables iteration-specific features
   */
  supportsIteration?: boolean;

  /**
   * Component is resizable by the user
   * When false, resize handles are hidden
   * @default true
   */
  isResizable?: boolean;

  /**
   * Component supports template bindings ({{variable}} syntax)
   * When true, enables template variable resolution
   * @default true
   */
  supportsTemplateBindings?: boolean;
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

  /**
   * Component capabilities that drive behavior in the builder
   * This replaces hardcoded componentId checks in the core application
   */
  capabilities?: ComponentCapabilities;

  /**
   * @deprecated Use capabilities.canHaveChildren instead
   * Kept for backward compatibility
   */
  canHaveChildren?: boolean;

  /** Allowed child component types (if canHaveChildren is true) */
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
