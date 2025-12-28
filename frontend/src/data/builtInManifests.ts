/**
 * Built-in Component Manifests
 *
 * These manifests define the configurable properties for built-in frontend components
 * that don't come from backend plugins. They are used by the PropertiesPanel to show
 * property editors for components like Label, Button, Container, etc.
 */

import { ComponentManifest, PropType } from '../types/builder';

/**
 * Label component manifest
 */
const labelManifest: ComponentManifest = {
  componentId: 'Label',
  displayName: 'Label',
  category: 'ui',
  icon: '📝',
  description: 'Text label supporting various HTML elements (h1-h6, p, span)',
  defaultProps: {
    text: 'Label Text',
    htmlTag: 'p',
    textAlign: 'left',
    truncate: false,
    maxLines: 0,
  },
  defaultStyles: {
    color: '#333333',
  },
  reactComponentPath: 'renderers/LabelRenderer',
  configurableProps: [
    {
      name: 'text',
      type: PropType.TEXTAREA,
      label: 'Text Content',
      defaultValue: 'Label Text',
      helpText: 'The text to display',
    },
    {
      name: 'htmlTag',
      type: PropType.SELECT,
      label: 'HTML Element',
      defaultValue: 'p',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'caption'],
      helpText: 'Choose the HTML element type',
    },
    {
      name: 'textAlign',
      type: PropType.SELECT,
      label: 'Text Align',
      defaultValue: 'left',
      options: ['left', 'center', 'right', 'justify'],
      helpText: 'Text alignment within the element',
    },
    {
      name: 'truncate',
      type: PropType.BOOLEAN,
      label: 'Truncate Text',
      defaultValue: false,
      helpText: 'Truncate text with ellipsis if it overflows',
    },
    {
      name: 'maxLines',
      type: PropType.NUMBER,
      label: 'Max Lines',
      defaultValue: 0,
      min: 0,
      max: 10,
      helpText: 'Maximum number of lines to display (0 = unlimited)',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 50,
    minHeight: 20,
    maxWidth: 2000,
    maxHeight: 1000,
  },
  pluginId: 'label-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Button component manifest
 */
const buttonManifest: ComponentManifest = {
  componentId: 'Button',
  displayName: 'Button',
  category: 'ui',
  icon: '🔘',
  description: 'Interactive button with various styles and sizes',
  defaultProps: {
    text: 'Click Me',
    variant: 'primary',
    size: 'medium',
    disabled: false,
    fullWidth: false,
  },
  defaultStyles: {},
  reactComponentPath: 'renderers/ButtonRenderer',
  configurableProps: [
    {
      name: 'text',
      type: PropType.STRING,
      label: 'Button Text',
      defaultValue: 'Click Me',
      helpText: 'Text displayed on the button',
    },
    {
      name: 'variant',
      type: PropType.SELECT,
      label: 'Variant',
      defaultValue: 'primary',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'outline-light', 'link'],
      helpText: 'Button style variant',
    },
    {
      name: 'size',
      type: PropType.SELECT,
      label: 'Size',
      defaultValue: 'medium',
      options: ['small', 'medium', 'large'],
      helpText: 'Button size',
    },
    {
      name: 'disabled',
      type: PropType.BOOLEAN,
      label: 'Disabled',
      defaultValue: false,
      helpText: 'Disable button interactions',
    },
    {
      name: 'fullWidth',
      type: PropType.BOOLEAN,
      label: 'Full Width',
      defaultValue: false,
      helpText: 'Make button span full container width',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 60,
    minHeight: 30,
    maxWidth: 500,
    maxHeight: 100,
  },
  pluginId: 'button-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Container component manifest
 */
const containerManifest: ComponentManifest = {
  componentId: 'Container',
  displayName: 'Container',
  category: 'layout',
  icon: '📦',
  description: 'Layout container for organizing child components',
  defaultProps: {
    layoutType: 'flex-column',
    layoutMode: 'flex-column',
    gap: '16px',
    padding: '20px',
    maxWidth: '1200px',
    centerContent: true,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
  },
  reactComponentPath: 'renderers/ContainerRenderer',
  configurableProps: [
    {
      name: 'layoutMode',
      type: PropType.SELECT,
      label: 'Layout Mode',
      defaultValue: 'flex-column',
      options: ['flex-column', 'flex-row', 'flex-wrap', 'grid-2col', 'grid-3col', 'grid-4col', 'grid-auto'],
      helpText: 'How child components are arranged',
    },
    {
      name: 'gap',
      type: PropType.STRING,
      label: 'Gap',
      defaultValue: '16px',
      helpText: 'Space between child components (e.g., 16px, 1rem)',
    },
    {
      name: 'padding',
      type: PropType.STRING,
      label: 'Padding',
      defaultValue: '20px',
      helpText: 'Inner padding of the container',
    },
    {
      name: 'maxWidth',
      type: PropType.STRING,
      label: 'Max Width',
      defaultValue: '1200px',
      helpText: 'Maximum width of the container (use "none" for no limit)',
    },
    {
      name: 'centerContent',
      type: PropType.BOOLEAN,
      label: 'Center Content',
      defaultValue: true,
      helpText: 'Center the container horizontally on the page',
    },
    {
      name: 'alignItems',
      type: PropType.SELECT,
      label: 'Align Items',
      defaultValue: 'stretch',
      options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'],
      helpText: 'Cross-axis alignment of children',
    },
    {
      name: 'justifyContent',
      type: PropType.SELECT,
      label: 'Justify Content',
      defaultValue: 'flex-start',
      options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'],
      helpText: 'Main-axis alignment of children',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 100,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 5000,
  },
  pluginId: 'container-layout-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: true,
};

/**
 * Textbox component manifest
 */
const textboxManifest: ComponentManifest = {
  componentId: 'Textbox',
  displayName: 'Text Input',
  category: 'form',
  icon: '✏️',
  description: 'Text input field with support for single or multi-line input',
  defaultProps: {
    placeholder: 'Enter text...',
    type: 'text',
    disabled: false,
    readOnly: false,
    required: false,
    multiline: false,
    rows: 3,
    maxLength: 0,
    label: '',
    showLabel: false,
  },
  defaultStyles: {},
  reactComponentPath: 'renderers/TextboxRenderer',
  configurableProps: [
    {
      name: 'placeholder',
      type: PropType.STRING,
      label: 'Placeholder',
      defaultValue: 'Enter text...',
      helpText: 'Placeholder text shown when empty',
    },
    {
      name: 'label',
      type: PropType.STRING,
      label: 'Label',
      defaultValue: '',
      helpText: 'Label text for the input field',
    },
    {
      name: 'showLabel',
      type: PropType.BOOLEAN,
      label: 'Show Label',
      defaultValue: false,
      helpText: 'Display the label above the input',
    },
    {
      name: 'type',
      type: PropType.SELECT,
      label: 'Input Type',
      defaultValue: 'text',
      options: ['text', 'email', 'password', 'tel', 'url', 'number'],
      helpText: 'Type of input field',
    },
    {
      name: 'multiline',
      type: PropType.BOOLEAN,
      label: 'Multiline',
      defaultValue: false,
      helpText: 'Use a textarea for multi-line input',
    },
    {
      name: 'rows',
      type: PropType.NUMBER,
      label: 'Rows',
      defaultValue: 3,
      min: 1,
      max: 20,
      helpText: 'Number of visible rows (for multiline)',
    },
    {
      name: 'maxLength',
      type: PropType.NUMBER,
      label: 'Max Length',
      defaultValue: 0,
      min: 0,
      helpText: 'Maximum character length (0 = unlimited)',
    },
    {
      name: 'required',
      type: PropType.BOOLEAN,
      label: 'Required',
      defaultValue: false,
      helpText: 'Mark field as required',
    },
    {
      name: 'disabled',
      type: PropType.BOOLEAN,
      label: 'Disabled',
      defaultValue: false,
      helpText: 'Disable the input field',
    },
    {
      name: 'readOnly',
      type: PropType.BOOLEAN,
      label: 'Read Only',
      defaultValue: false,
      helpText: 'Make the field read-only',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 100,
    minHeight: 30,
    maxWidth: 1000,
    maxHeight: 500,
  },
  pluginId: 'textbox-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Default component manifest
 */
const navbarDefaultManifest: ComponentManifest = {
  componentId: 'NavbarDefault',
  displayName: 'Navbar (Default)',
  category: 'navigation',
  icon: '🧭',
  description: 'Default navbar with brand on left and navigation links on right',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'default',
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#007bff',
  },
  reactComponentPath: 'renderers/NavbarDefaultRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Centered component manifest
 */
const navbarCenteredManifest: ComponentManifest = {
  componentId: 'NavbarCentered',
  displayName: 'Navbar (Centered)',
  category: 'navigation',
  icon: '🧭',
  description: 'Centered navbar with brand in the middle',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'centered',
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#007bff',
  },
  reactComponentPath: 'renderers/NavbarCenteredRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Dark component manifest
 */
const navbarDarkManifest: ComponentManifest = {
  componentId: 'NavbarDark',
  displayName: 'Navbar (Dark)',
  category: 'navigation',
  icon: '🧭',
  description: 'Dark themed navbar',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'default',
  },
  defaultStyles: {
    backgroundColor: '#1a1a2e',
    textColor: '#ffffff',
    accentColor: '#4dabf7',
  },
  reactComponentPath: 'renderers/NavbarDarkRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Minimal component manifest
 */
const navbarMinimalManifest: ComponentManifest = {
  componentId: 'NavbarMinimal',
  displayName: 'Navbar (Minimal)',
  category: 'navigation',
  icon: '🧭',
  description: 'Minimalist navbar with clean styling',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'default',
  },
  defaultStyles: {
    backgroundColor: 'transparent',
    textColor: '#333333',
    accentColor: '#007bff',
  },
  reactComponentPath: 'renderers/NavbarMinimalRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Glass component manifest
 */
const navbarGlassManifest: ComponentManifest = {
  componentId: 'NavbarGlass',
  displayName: 'Navbar (Glass)',
  category: 'navigation',
  icon: '🧭',
  description: 'Glassmorphism styled navbar with blur effect',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'default',
  },
  defaultStyles: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    textColor: '#333333',
    accentColor: '#007bff',
  },
  reactComponentPath: 'renderers/NavbarGlassRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Navbar Sticky component manifest
 */
const navbarStickyManifest: ComponentManifest = {
  componentId: 'NavbarSticky',
  displayName: 'Navbar (Sticky)',
  category: 'navigation',
  icon: '🧭',
  description: 'Sticky navbar that stays at the top when scrolling',
  defaultProps: {
    brandText: 'My Site',
    navItems: [
      { label: 'Home', href: '/', active: true },
      { label: 'About', href: '/about', active: false },
      { label: 'Services', href: '/services', active: false },
      { label: 'Contact', href: '/contact', active: false },
    ],
    layout: 'default',
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    accentColor: '#007bff',
  },
  reactComponentPath: 'renderers/NavbarStickyRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Brand Text',
      defaultValue: 'My Site',
      helpText: 'Text displayed as the brand/logo',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'Array of navigation items with label, href, and active properties',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 150,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Image component manifest
 */
const imageManifest: ComponentManifest = {
  componentId: 'Image',
  displayName: 'Image',
  category: 'ui',
  icon: '🖼️',
  description: 'Image component with placeholder support and various display options',
  defaultProps: {
    src: '',
    alt: 'Image',
    objectFit: 'cover',
    objectPosition: 'center',
    aspectRatio: 'auto',
    borderRadius: '0px',
    placeholder: 'icon',
    placeholderColor: '#e9ecef',
    caption: '',
    showCaption: false,
    lazyLoad: true,
  },
  defaultStyles: {},
  reactComponentPath: 'renderers/ImageRenderer',
  configurableProps: [
    {
      name: 'src',
      type: PropType.URL,
      label: 'Image URL',
      defaultValue: '',
      helpText: 'URL of the image to display',
    },
    {
      name: 'alt',
      type: PropType.STRING,
      label: 'Alt Text',
      defaultValue: 'Image',
      helpText: 'Alternative text for accessibility',
    },
    {
      name: 'aspectRatio',
      type: PropType.SELECT,
      label: 'Aspect Ratio',
      defaultValue: 'auto',
      options: ['auto', '1:1', '4:3', '16:9', '3:2', '2:3', '3:4', '9:16', 'circle'],
      helpText: 'Fixed aspect ratio for the image',
    },
    {
      name: 'objectFit',
      type: PropType.SELECT,
      label: 'Object Fit',
      defaultValue: 'cover',
      options: ['cover', 'contain', 'fill', 'none', 'scale-down'],
      helpText: 'How the image should fit within its container',
    },
    {
      name: 'objectPosition',
      type: PropType.SELECT,
      label: 'Object Position',
      defaultValue: 'center',
      options: ['center', 'top', 'bottom', 'left', 'right', 'top left', 'top right', 'bottom left', 'bottom right'],
      helpText: 'Position of the image within its container',
    },
    {
      name: 'borderRadius',
      type: PropType.STRING,
      label: 'Border Radius',
      defaultValue: '0px',
      helpText: 'Rounded corners (e.g., 8px, 50%)',
    },
    {
      name: 'placeholder',
      type: PropType.SELECT,
      label: 'Placeholder Type',
      defaultValue: 'icon',
      options: ['icon', 'color'],
      helpText: 'What to show when image is loading or missing',
    },
    {
      name: 'placeholderColor',
      type: PropType.COLOR,
      label: 'Placeholder Color',
      defaultValue: '#e9ecef',
      helpText: 'Background color for placeholder',
    },
    {
      name: 'caption',
      type: PropType.STRING,
      label: 'Caption',
      defaultValue: '',
      helpText: 'Caption text below the image',
    },
    {
      name: 'showCaption',
      type: PropType.BOOLEAN,
      label: 'Show Caption',
      defaultValue: false,
      helpText: 'Display the caption below the image',
    },
    {
      name: 'lazyLoad',
      type: PropType.BOOLEAN,
      label: 'Lazy Load',
      defaultValue: true,
      helpText: 'Load image only when visible in viewport',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 50,
    minHeight: 50,
    maxWidth: 2000,
    maxHeight: 2000,
  },
  pluginId: 'image-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Repeater component manifest
 */
const repeaterManifest: ComponentManifest = {
  componentId: 'Repeater',
  displayName: 'Repeater',
  category: 'data',
  icon: '🔁',
  description: 'Iterate over array data and render children for each item',
  defaultProps: {
    dataPath: 'items',
    itemAlias: 'item',
    indexAlias: 'index',
    emptyMessage: 'No items to display',
    layoutType: 'flex-column',
    gap: '16px',
  },
  defaultStyles: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  reactComponentPath: 'renderers/RepeaterRenderer',
  configurableProps: [
    {
      name: 'dataPath',
      type: PropType.STRING,
      label: 'Data Path',
      defaultValue: 'items',
      helpText: "Path to the array in the data source (e.g., 'items', 'data.products')",
    },
    {
      name: 'itemAlias',
      type: PropType.STRING,
      label: 'Item Variable',
      defaultValue: 'item',
      helpText: 'Variable name for current item (use {{item.field}} in children)',
    },
    {
      name: 'indexAlias',
      type: PropType.STRING,
      label: 'Index Variable',
      defaultValue: 'index',
      helpText: 'Variable name for current index',
    },
    {
      name: 'emptyMessage',
      type: PropType.STRING,
      label: 'Empty Message',
      defaultValue: 'No items to display',
      helpText: 'Message shown when data array is empty',
    },
    {
      name: 'layoutType',
      type: PropType.SELECT,
      label: 'Layout Type',
      defaultValue: 'flex-column',
      options: ['flex-column', 'flex-row', 'flex-wrap', 'grid-2col', 'grid-3col', 'grid-4col'],
      helpText: 'How repeated items are arranged',
    },
    {
      name: 'gap',
      type: PropType.STRING,
      label: 'Gap',
      defaultValue: '16px',
      helpText: 'Space between repeated items (e.g., 16px, 1rem)',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 100,
    minHeight: 50,
    maxWidth: 3000,
    maxHeight: 5000,
  },
  pluginId: 'repeater-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: true,
};

/**
 * DataList component manifest
 */
const dataListManifest: ComponentManifest = {
  componentId: 'DataList',
  displayName: 'Data List',
  category: 'data',
  icon: '📋',
  description: 'Pre-styled list for displaying data as cards, table, or list',
  defaultProps: {
    listStyle: 'cards',
    dataPath: 'items',
    titleField: 'title',
    descriptionField: 'description',
    imageField: 'image',
    pagination: false,
    pageSize: 10,
    emptyMessage: 'No items to display',
  },
  defaultStyles: {
    gap: '24px',
  },
  reactComponentPath: 'renderers/DataListRenderer',
  configurableProps: [
    {
      name: 'listStyle',
      type: PropType.SELECT,
      label: 'List Style',
      defaultValue: 'cards',
      options: ['cards', 'table', 'list', 'grid'],
      helpText: 'Visual style for displaying data',
    },
    {
      name: 'dataPath',
      type: PropType.STRING,
      label: 'Data Path',
      defaultValue: 'items',
      helpText: 'Path to the array in the data source',
    },
    {
      name: 'titleField',
      type: PropType.STRING,
      label: 'Title Field',
      defaultValue: 'title',
      helpText: 'Field name for item title',
    },
    {
      name: 'descriptionField',
      type: PropType.STRING,
      label: 'Description Field',
      defaultValue: 'description',
      helpText: 'Field name for item description',
    },
    {
      name: 'imageField',
      type: PropType.STRING,
      label: 'Image Field',
      defaultValue: 'image',
      helpText: 'Field name for item image URL',
    },
    {
      name: 'pagination',
      type: PropType.BOOLEAN,
      label: 'Enable Pagination',
      defaultValue: false,
      helpText: 'Show pagination controls',
    },
    {
      name: 'pageSize',
      type: PropType.NUMBER,
      label: 'Page Size',
      defaultValue: 10,
      helpText: 'Items per page when pagination is enabled',
    },
    {
      name: 'emptyMessage',
      type: PropType.STRING,
      label: 'Empty Message',
      defaultValue: 'No items to display',
      helpText: 'Message shown when data array is empty',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 200,
    minHeight: 100,
    maxWidth: 3000,
    maxHeight: 5000,
  },
  pluginId: 'datalist-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Sidebar Navigation component manifest
 */
const sidebarNavManifest: ComponentManifest = {
  componentId: 'SidebarNav',
  displayName: 'Sidebar Navigation',
  category: 'navbar',
  icon: '📋',
  description: 'Vertical sidebar navigation with collapsible option',
  defaultProps: {
    brandText: 'Menu',
    navItems: [
      { label: 'Dashboard', href: '/dashboard', icon: '🏠', active: true },
      { label: 'Analytics', href: '/analytics', icon: '📊', active: false },
      { label: 'Projects', href: '/projects', icon: '📁', active: false },
      { label: 'Settings', href: '/settings', icon: '⚙️', active: false },
    ],
    collapsed: false,
    collapsible: true,
    position: 'left',
    showIcons: true,
  },
  defaultStyles: {
    backgroundColor: '#2c3e50',
    textColor: '#ecf0f1',
    accentColor: '#3498db',
    width: '250px',
  },
  reactComponentPath: 'renderers/SidebarNavRenderer',
  configurableProps: [
    {
      name: 'brandText',
      type: PropType.STRING,
      label: 'Title Text',
      defaultValue: 'Menu',
      helpText: 'Text displayed at the top of sidebar',
    },
    {
      name: 'navItems',
      type: PropType.JSON,
      label: 'Navigation Items',
      defaultValue: [],
      helpText: 'JSON array of navigation items with icons',
    },
    {
      name: 'collapsed',
      type: PropType.BOOLEAN,
      label: 'Start Collapsed',
      defaultValue: false,
      helpText: 'Start sidebar in collapsed state',
    },
    {
      name: 'collapsible',
      type: PropType.BOOLEAN,
      label: 'Collapsible',
      defaultValue: true,
      helpText: 'Allow sidebar to be collapsed',
    },
    {
      name: 'position',
      type: PropType.SELECT,
      label: 'Position',
      defaultValue: 'left',
      options: ['left', 'right'],
      helpText: 'Sidebar position',
    },
    {
      name: 'showIcons',
      type: PropType.BOOLEAN,
      label: 'Show Icons',
      defaultValue: true,
      helpText: 'Display icons next to menu items',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 60,
    minHeight: 200,
    maxWidth: 400,
    maxHeight: 3000,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * Top Header Bar component manifest
 */
const topHeaderBarManifest: ComponentManifest = {
  componentId: 'TopHeaderBar',
  displayName: 'Top Header Bar',
  category: 'navbar',
  icon: '📢',
  description: 'Utility bar for contact info, social links above main navigation',
  defaultProps: {
    leftContent: '📧 contact@example.com',
    rightContent: '📞 +1 234 567 890',
    centerContent: '',
    showSocialLinks: true,
    socialLinks: [
      { platform: 'facebook', url: '#', icon: '📘' },
      { platform: 'twitter', url: '#', icon: '🐦' },
      { platform: 'linkedin', url: '#', icon: '💼' },
    ],
  },
  defaultStyles: {
    backgroundColor: '#f8f9fa',
    textColor: '#666666',
    accentColor: '#007bff',
    padding: '8px 20px',
    fontSize: '13px',
  },
  reactComponentPath: 'renderers/TopHeaderBarRenderer',
  configurableProps: [
    {
      name: 'leftContent',
      type: PropType.STRING,
      label: 'Left Content',
      defaultValue: '📧 contact@example.com',
      helpText: 'Content for the left side (e.g., email)',
    },
    {
      name: 'rightContent',
      type: PropType.STRING,
      label: 'Right Content',
      defaultValue: '📞 +1 234 567 890',
      helpText: 'Content for the right side (e.g., phone)',
    },
    {
      name: 'centerContent',
      type: PropType.STRING,
      label: 'Center Content',
      defaultValue: '',
      helpText: 'Content for the center (e.g., announcement)',
    },
    {
      name: 'showSocialLinks',
      type: PropType.BOOLEAN,
      label: 'Show Social Links',
      defaultValue: true,
      helpText: 'Display social media icons',
    },
    {
      name: 'socialLinks',
      type: PropType.JSON,
      label: 'Social Links',
      defaultValue: [],
      helpText: 'JSON array of social media links',
    },
  ],
  configurableStyles: [],
  sizeConstraints: {
    minWidth: 300,
    minHeight: 24,
    maxWidth: 3000,
    maxHeight: 60,
  },
  pluginId: 'navbar-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * LoginForm component manifest
 */
const loginFormManifest: ComponentManifest = {
  componentId: 'LoginForm',
  displayName: 'Login Form',
  category: 'form',
  icon: '🔐',
  description: 'Username/password login form with configurable fields and styling',
  defaultProps: {
    title: 'Sign In',
    subtitle: 'Welcome back! Please sign in to continue.',
    usernameLabel: 'Email or Username',
    usernamePlaceholder: 'Enter your email or username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    submitButtonText: 'Sign In',
    showRememberMe: true,
    rememberMeLabel: 'Remember me',
    showForgotPassword: true,
    forgotPasswordText: 'Forgot password?',
    forgotPasswordUrl: '/forgot-password',
    showRegisterLink: true,
    registerText: "Don't have an account?",
    registerLinkText: 'Sign up',
    registerUrl: '/register',
    loginEndpoint: '/api/auth/login',
    redirectUrl: '/',
    showSocialLogin: false,
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  reactComponentPath: 'renderers/LoginFormRenderer',
  configurableProps: [
    { name: 'title', type: PropType.STRING, label: 'Title', defaultValue: 'Sign In' },
    { name: 'subtitle', type: PropType.STRING, label: 'Subtitle', defaultValue: 'Welcome back!' },
    { name: 'usernameLabel', type: PropType.STRING, label: 'Username Label', defaultValue: 'Email or Username' },
    { name: 'passwordLabel', type: PropType.STRING, label: 'Password Label', defaultValue: 'Password' },
    { name: 'submitButtonText', type: PropType.STRING, label: 'Submit Button Text', defaultValue: 'Sign In' },
    { name: 'showRememberMe', type: PropType.BOOLEAN, label: 'Show Remember Me', defaultValue: true },
    { name: 'showForgotPassword', type: PropType.BOOLEAN, label: 'Show Forgot Password Link', defaultValue: true },
    { name: 'forgotPasswordUrl', type: PropType.STRING, label: 'Forgot Password URL', defaultValue: '/forgot-password' },
    { name: 'showRegisterLink', type: PropType.BOOLEAN, label: 'Show Register Link', defaultValue: true },
    { name: 'registerUrl', type: PropType.STRING, label: 'Register URL', defaultValue: '/register' },
    { name: 'loginEndpoint', type: PropType.STRING, label: 'Login API Endpoint', defaultValue: '/api/auth/login' },
    { name: 'redirectUrl', type: PropType.STRING, label: 'Redirect After Login', defaultValue: '/' },
    { name: 'showSocialLogin', type: PropType.BOOLEAN, label: 'Show Social Login', defaultValue: false },
  ],
  configurableStyles: [],
  sizeConstraints: { minWidth: 280, minHeight: 300, maxWidth: 600, maxHeight: 800 },
  pluginId: 'auth-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * RegisterForm component manifest
 */
const registerFormManifest: ComponentManifest = {
  componentId: 'RegisterForm',
  displayName: 'Register Form',
  category: 'form',
  icon: '📝',
  description: 'User registration form with configurable fields and validation',
  defaultProps: {
    title: 'Create Account',
    subtitle: 'Join us today! Create your account to get started.',
    showFullName: true,
    fullNameLabel: 'Full Name',
    emailLabel: 'Email',
    usernameLabel: 'Username',
    showUsername: true,
    passwordLabel: 'Password',
    showConfirmPassword: true,
    confirmPasswordLabel: 'Confirm Password',
    submitButtonText: 'Create Account',
    showTermsCheckbox: true,
    termsText: 'I agree to the',
    termsLinkText: 'Terms of Service',
    termsUrl: '/terms',
    showLoginLink: true,
    loginText: 'Already have an account?',
    loginLinkText: 'Sign in',
    loginUrl: '/login',
    registerEndpoint: '/api/auth/register',
    redirectUrl: '/login',
    passwordMinLength: 8,
    requireUppercase: true,
    requireNumber: true,
    requireSpecialChar: false,
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  reactComponentPath: 'renderers/RegisterFormRenderer',
  configurableProps: [
    { name: 'title', type: PropType.STRING, label: 'Title', defaultValue: 'Create Account' },
    { name: 'subtitle', type: PropType.STRING, label: 'Subtitle', defaultValue: 'Join us today!' },
    { name: 'showFullName', type: PropType.BOOLEAN, label: 'Show Full Name Field', defaultValue: true },
    { name: 'showUsername', type: PropType.BOOLEAN, label: 'Show Username Field', defaultValue: true },
    { name: 'showConfirmPassword', type: PropType.BOOLEAN, label: 'Show Confirm Password', defaultValue: true },
    { name: 'submitButtonText', type: PropType.STRING, label: 'Submit Button Text', defaultValue: 'Create Account' },
    { name: 'showTermsCheckbox', type: PropType.BOOLEAN, label: 'Show Terms Checkbox', defaultValue: true },
    { name: 'termsUrl', type: PropType.STRING, label: 'Terms URL', defaultValue: '/terms' },
    { name: 'showLoginLink', type: PropType.BOOLEAN, label: 'Show Login Link', defaultValue: true },
    { name: 'loginUrl', type: PropType.STRING, label: 'Login URL', defaultValue: '/login' },
    { name: 'registerEndpoint', type: PropType.STRING, label: 'Register API Endpoint', defaultValue: '/api/auth/register' },
    { name: 'redirectUrl', type: PropType.STRING, label: 'Redirect After Register', defaultValue: '/login' },
    { name: 'passwordMinLength', type: PropType.NUMBER, label: 'Min Password Length', defaultValue: 8 },
    { name: 'requireUppercase', type: PropType.BOOLEAN, label: 'Require Uppercase', defaultValue: true },
    { name: 'requireNumber', type: PropType.BOOLEAN, label: 'Require Number', defaultValue: true },
    { name: 'requireSpecialChar', type: PropType.BOOLEAN, label: 'Require Special Character', defaultValue: false },
  ],
  configurableStyles: [],
  sizeConstraints: { minWidth: 280, minHeight: 400, maxWidth: 600, maxHeight: 1000 },
  pluginId: 'auth-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * SocialLoginButtons component manifest
 */
const socialLoginButtonsManifest: ComponentManifest = {
  componentId: 'SocialLoginButtons',
  displayName: 'Social Login Buttons',
  category: 'form',
  icon: '🌐',
  description: 'Social login buttons for Google, GitHub, Facebook, etc.',
  defaultProps: {
    showGoogle: true,
    showGithub: true,
    showFacebook: false,
    showTwitter: false,
    showLinkedIn: false,
    showApple: false,
    showMicrosoft: false,
    layout: 'vertical',
    buttonStyle: 'filled',
    showIcon: true,
    showLabel: true,
    googleText: 'Continue with Google',
    githubText: 'Continue with GitHub',
    facebookText: 'Continue with Facebook',
    dividerText: 'or continue with',
    showDivider: true,
    googleAuthUrl: '/oauth2/authorization/google',
    githubAuthUrl: '/oauth2/authorization/github',
    facebookAuthUrl: '/oauth2/authorization/facebook',
  },
  defaultStyles: {
    gap: '12px',
    width: '100%',
  },
  reactComponentPath: 'renderers/SocialLoginButtonsRenderer',
  configurableProps: [
    { name: 'showGoogle', type: PropType.BOOLEAN, label: 'Show Google', defaultValue: true },
    { name: 'showGithub', type: PropType.BOOLEAN, label: 'Show GitHub', defaultValue: true },
    { name: 'showFacebook', type: PropType.BOOLEAN, label: 'Show Facebook', defaultValue: false },
    { name: 'showTwitter', type: PropType.BOOLEAN, label: 'Show Twitter/X', defaultValue: false },
    { name: 'showLinkedIn', type: PropType.BOOLEAN, label: 'Show LinkedIn', defaultValue: false },
    { name: 'showApple', type: PropType.BOOLEAN, label: 'Show Apple', defaultValue: false },
    { name: 'showMicrosoft', type: PropType.BOOLEAN, label: 'Show Microsoft', defaultValue: false },
    { name: 'layout', type: PropType.SELECT, label: 'Layout', defaultValue: 'vertical', options: ['vertical', 'horizontal', 'grid'] },
    { name: 'buttonStyle', type: PropType.SELECT, label: 'Button Style', defaultValue: 'filled', options: ['filled', 'outlined', 'icon-only'] },
    { name: 'showIcon', type: PropType.BOOLEAN, label: 'Show Icons', defaultValue: true },
    { name: 'showLabel', type: PropType.BOOLEAN, label: 'Show Labels', defaultValue: true },
    { name: 'showDivider', type: PropType.BOOLEAN, label: 'Show Divider', defaultValue: true },
    { name: 'dividerText', type: PropType.STRING, label: 'Divider Text', defaultValue: 'or continue with' },
  ],
  configurableStyles: [],
  sizeConstraints: { minWidth: 200, minHeight: 50, maxWidth: 600, maxHeight: 400 },
  pluginId: 'auth-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * ForgotPasswordForm component manifest
 */
const forgotPasswordFormManifest: ComponentManifest = {
  componentId: 'ForgotPasswordForm',
  displayName: 'Forgot Password Form',
  category: 'form',
  icon: '🔑',
  description: 'Password reset request form',
  defaultProps: {
    title: 'Reset Password',
    subtitle: "Enter your email and we'll send you a reset link.",
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email',
    submitButtonText: 'Send Reset Link',
    showBackToLogin: true,
    backToLoginText: 'Back to',
    backToLoginLinkText: 'Sign in',
    backToLoginUrl: '/login',
    resetEndpoint: '/api/auth/forgot-password',
    successMessage: 'If an account exists with this email, you will receive a password reset link.',
    showSuccessIcon: true,
  },
  defaultStyles: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
  },
  reactComponentPath: 'renderers/ForgotPasswordFormRenderer',
  configurableProps: [
    { name: 'title', type: PropType.STRING, label: 'Title', defaultValue: 'Reset Password' },
    { name: 'subtitle', type: PropType.STRING, label: 'Subtitle', defaultValue: "Enter your email and we'll send you a reset link." },
    { name: 'emailLabel', type: PropType.STRING, label: 'Email Label', defaultValue: 'Email Address' },
    { name: 'submitButtonText', type: PropType.STRING, label: 'Submit Button Text', defaultValue: 'Send Reset Link' },
    { name: 'showBackToLogin', type: PropType.BOOLEAN, label: 'Show Back to Login', defaultValue: true },
    { name: 'backToLoginUrl', type: PropType.STRING, label: 'Login URL', defaultValue: '/login' },
    { name: 'resetEndpoint', type: PropType.STRING, label: 'Reset API Endpoint', defaultValue: '/api/auth/forgot-password' },
    { name: 'successMessage', type: PropType.STRING, label: 'Success Message', defaultValue: 'If an account exists with this email, you will receive a password reset link.' },
  ],
  configurableStyles: [],
  sizeConstraints: { minWidth: 280, minHeight: 250, maxWidth: 600, maxHeight: 500 },
  pluginId: 'auth-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * LogoutButton component manifest
 */
const logoutButtonManifest: ComponentManifest = {
  componentId: 'LogoutButton',
  displayName: 'Logout Button',
  category: 'form',
  icon: '🚪',
  description: 'Button to log out the current user',
  defaultProps: {
    text: 'Sign Out',
    icon: '🚪',
    showIcon: true,
    iconPosition: 'left',
    variant: 'secondary',
    size: 'medium',
    logoutEndpoint: '/api/auth/logout',
    redirectUrl: '/',
    confirmLogout: false,
    confirmTitle: 'Sign Out',
    confirmMessage: 'Are you sure you want to sign out?',
    confirmButtonText: 'Sign Out',
    cancelButtonText: 'Cancel',
    showOnlyWhenLoggedIn: true,
  },
  defaultStyles: {
    backgroundColor: '#6c757d',
    textColor: '#ffffff',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
  },
  reactComponentPath: 'renderers/LogoutButtonRenderer',
  configurableProps: [
    { name: 'text', type: PropType.STRING, label: 'Button Text', defaultValue: 'Sign Out' },
    { name: 'showIcon', type: PropType.BOOLEAN, label: 'Show Icon', defaultValue: true },
    { name: 'iconPosition', type: PropType.SELECT, label: 'Icon Position', defaultValue: 'left', options: ['left', 'right'] },
    { name: 'variant', type: PropType.SELECT, label: 'Variant', defaultValue: 'secondary', options: ['primary', 'secondary', 'danger', 'text', 'outlined'] },
    { name: 'size', type: PropType.SELECT, label: 'Size', defaultValue: 'medium', options: ['small', 'medium', 'large'] },
    { name: 'logoutEndpoint', type: PropType.STRING, label: 'Logout API Endpoint', defaultValue: '/api/auth/logout' },
    { name: 'redirectUrl', type: PropType.STRING, label: 'Redirect After Logout', defaultValue: '/' },
    { name: 'confirmLogout', type: PropType.BOOLEAN, label: 'Confirm Before Logout', defaultValue: false },
    { name: 'confirmMessage', type: PropType.STRING, label: 'Confirm Message', defaultValue: 'Are you sure you want to sign out?' },
    { name: 'showOnlyWhenLoggedIn', type: PropType.BOOLEAN, label: 'Show Only When Logged In', defaultValue: true, helpText: 'Hide button when user is not authenticated' },
  ],
  configurableStyles: [],
  sizeConstraints: { minWidth: 80, minHeight: 32, maxWidth: 300, maxHeight: 80 },
  pluginId: 'auth-component-plugin',
  pluginVersion: '1.0.0',
  canHaveChildren: false,
};

/**
 * All built-in manifests indexed by key (pluginId:componentId)
 */
export const builtInManifests: Record<string, ComponentManifest> = {
  // Core UI components (matching backend plugin IDs)
  'label-component-plugin:Label': labelManifest,
  'button-component-plugin:Button': buttonManifest,
  'container-layout-plugin:Container': containerManifest,
  'textbox-component-plugin:Textbox': textboxManifest,
  'image-component-plugin:Image': imageManifest,

  // Aliases for 'core-ui' pluginId used in UI templates
  'core-ui:Label': labelManifest,
  'core-ui:Button': buttonManifest,
  'core-ui:Container': containerManifest,
  'core-ui:Textbox': textboxManifest,
  'core-ui:Image': imageManifest,

  // Data components
  'repeater-component-plugin:Repeater': repeaterManifest,
  'datalist-component-plugin:DataList': dataListManifest,

  // Navbar components
  'navbar-component-plugin:NavbarDefault': navbarDefaultManifest,
  'navbar-component-plugin:NavbarCentered': navbarCenteredManifest,
  'navbar-component-plugin:NavbarDark': navbarDarkManifest,
  'navbar-component-plugin:NavbarMinimal': navbarMinimalManifest,
  'navbar-component-plugin:NavbarGlass': navbarGlassManifest,
  'navbar-component-plugin:NavbarSticky': navbarStickyManifest,
  'navbar-component-plugin:SidebarNav': sidebarNavManifest,
  'navbar-component-plugin:TopHeaderBar': topHeaderBarManifest,

  // Aliases for 'core-navbar' pluginId used in UI templates
  'core-navbar:NavbarDefault': navbarDefaultManifest,
  'core-navbar:NavbarCentered': navbarCenteredManifest,
  'core-navbar:NavbarDark': navbarDarkManifest,
  'core-navbar:NavbarMinimal': navbarMinimalManifest,
  'core-navbar:NavbarGlass': navbarGlassManifest,
  'core-navbar:NavbarSticky': navbarStickyManifest,
  'core-navbar:SidebarNav': sidebarNavManifest,
  'core-navbar:TopHeaderBar': topHeaderBarManifest,

  // Auth components
  'auth-component-plugin:LoginForm': loginFormManifest,
  'auth-component-plugin:RegisterForm': registerFormManifest,
  'auth-component-plugin:SocialLoginButtons': socialLoginButtonsManifest,
  'auth-component-plugin:ForgotPasswordForm': forgotPasswordFormManifest,
  'auth-component-plugin:LogoutButton': logoutButtonManifest,
};

/**
 * Get a built-in manifest by pluginId and componentId
 */
export const getBuiltInManifest = (pluginId: string, componentId: string): ComponentManifest | null => {
  const key = `${pluginId}:${componentId}`;
  return builtInManifests[key] || null;
};

/**
 * Check if a component has a built-in manifest
 */
export const hasBuiltInManifest = (pluginId: string, componentId: string): boolean => {
  const key = `${pluginId}:${componentId}`;
  return key in builtInManifests;
};

/**
 * Get all built-in manifest keys
 */
export const getBuiltInManifestKeys = (): string[] => {
  return Object.keys(builtInManifests);
};
