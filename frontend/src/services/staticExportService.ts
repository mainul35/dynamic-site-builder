import { PageDefinition, ComponentInstance } from '../types/builder';
import { Page } from '../types/site';
import JSZip from 'jszip';
import { ExportTemplateRegistry } from './ExportTemplateRegistry';

/**
 * StaticExportService - Exports site pages as deployable static HTML/CSS/JS files
 * Preserves layout styles (flex, grid) and component styling from the builder
 */

interface ExportOptions {
  includeCss: boolean;
  includeJs: boolean;
  minify: boolean;
  singlePage: boolean;
}

interface SiteExportData {
  pages: Array<{
    page: Page;
    definition: PageDefinition;
  }>;
  siteName: string;
}

/**
 * Convert camelCase to kebab-case for CSS properties
 */
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Generate inline style string from styles object
 */
function generateInlineStyle(styles: Record<string, any>): string {
  if (!styles || Object.keys(styles).length === 0) return '';

  const cssProperties: string[] = [];
  for (const [key, value] of Object.entries(styles)) {
    if (value !== undefined && value !== null && value !== '') {
      const cssKey = camelToKebab(key);
      cssProperties.push(`${cssKey}: ${value}`);
    }
  }

  return cssProperties.join('; ');
}

/**
 * Get container layout styles based on layoutType or layoutMode prop
 * Templates use layoutMode, builder uses layoutType - check both
 *
 * IMPORTANT: This function returns base layout styles only.
 * Override properties (flexWrap, alignItems, justifyContent) should be
 * applied AFTER these base styles based on component props/styles.
 */
function getContainerLayoutStyles(props: Record<string, any>): Record<string, string> {
  // Check both layoutType and layoutMode (templates use layoutMode)
  const layoutType = props.layoutType || props.layoutMode || 'flex-column';
  const styles: Record<string, string> = {};

  switch (layoutType) {
    case 'flex-row':
      styles.display = 'flex';
      styles.flexDirection = 'row';
      // Don't set flexWrap here - let component styles/props override
      break;
    case 'flex-wrap':
      styles.display = 'flex';
      styles.flexDirection = 'row';
      styles.flexWrap = 'wrap';
      break;
    case 'grid-2col':
      styles.display = 'grid';
      styles.gridTemplateColumns = 'repeat(2, 1fr)';
      break;
    case 'grid-3col':
      styles.display = 'grid';
      styles.gridTemplateColumns = 'repeat(3, 1fr)';
      break;
    case 'grid-4col':
      styles.display = 'grid';
      styles.gridTemplateColumns = 'repeat(4, 1fr)';
      break;
    case 'grid-auto':
      styles.display = 'grid';
      styles.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
      break;
    // Asymmetric 2-column layouts
    case 'grid-20-80':
      styles.display = 'grid';
      styles.gridTemplateColumns = '20% 80%';
      break;
    case 'grid-25-75':
      styles.display = 'grid';
      styles.gridTemplateColumns = '25% 75%';
      break;
    case 'grid-33-67':
      styles.display = 'grid';
      styles.gridTemplateColumns = '33.33% 66.67%';
      break;
    case 'grid-40-60':
      styles.display = 'grid';
      styles.gridTemplateColumns = '40% 60%';
      break;
    case 'grid-60-40':
      styles.display = 'grid';
      styles.gridTemplateColumns = '60% 40%';
      break;
    case 'grid-67-33':
      styles.display = 'grid';
      styles.gridTemplateColumns = '66.67% 33.33%';
      break;
    case 'grid-75-25':
      styles.display = 'grid';
      styles.gridTemplateColumns = '75% 25%';
      break;
    case 'grid-80-20':
      styles.display = 'grid';
      styles.gridTemplateColumns = '80% 20%';
      break;
    case 'flex-column':
    default:
      styles.display = 'flex';
      styles.flexDirection = 'column';
      break;
  }

  // Add container-specific styles from props
  if (props.padding) styles.padding = props.padding;
  if (props.maxWidth && props.maxWidth !== 'none') styles.maxWidth = props.maxWidth;
  if (props.centerContent) styles.margin = '0 auto';

  return styles;
}

/**
 * Merge component styles with layout styles
 */
function mergeStyles(...styleObjects: Record<string, any>[]): Record<string, any> {
  const merged: Record<string, any> = {};
  for (const obj of styleObjects) {
    if (obj) {
      Object.assign(merged, obj);
    }
  }
  return merged;
}

/**
 * Generate HTML for a component with proper layout preservation
 */
function generateComponentHTML(component: ComponentInstance, depth: number = 0): string {
  const { componentId, props, styles, instanceId, children } = component;
  const indent = '  '.repeat(depth);
  const id = `component-${instanceId}`;

  // First, check if there's a registered export template for this component
  // This allows plugins to define their own export templates
  if (ExportTemplateRegistry.has(componentId, component.pluginId)) {
    const childrenHtml = (children || [])
      .map(child => generateComponentHTML(child, depth + 1))
      .join('\n');

    const templateHtml = ExportTemplateRegistry.renderStatic(component, childrenHtml);
    if (templateHtml) {
      // Wrap with indent and id
      return `${indent}<div id="${id}" class="component ${componentId.toLowerCase()}">${templateHtml}</div>`;
    }
  }

  // Handle different component types with built-in templates
  switch (componentId) {
    case 'Label':
      return generateLabelHTML(component, id, indent);

    case 'Button':
      return generateButtonHTML(component, id, indent);

    case 'Image':
      return generateImageHTML(component, id, indent);

    case 'Textbox':
      return generateTextboxHTML(component, id, indent);

    case 'Container':
    case 'ScrollableContainer':
      return generateContainerHTML(component, id, indent, depth);

    case 'Navbar':
    case 'NavbarDefault':
    case 'NavbarCentered':
    case 'NavbarMinimal':
    case 'NavbarDark':
    case 'NavbarGlass':
    case 'NavbarSticky':
      return generateNavbarHTML(component, id, indent);

    default:
      return generateGenericHTML(component, id, indent, depth);
  }
}

/**
 * Generate Label HTML
 */
function generateLabelHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles } = component;
  const text = props.text || '';
  const variant = props.variant || 'span';

  // Map variant to HTML tag
  const tagMap: Record<string, string> = {
    h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
    paragraph: 'p', span: 'span', label: 'label'
  };
  const tag = tagMap[variant] || 'span';

  const inlineStyle = generateInlineStyle(styles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  return `${indent}<${tag} id="${id}" class="component label"${styleAttr}>${escapeHtml(text)}</${tag}>`;
}

/**
 * Generate Button HTML with event handling
 */
function generateButtonHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles } = component;
  const text = props.text || 'Click Me';
  const variant = props.variant || 'primary';
  const size = props.size || 'medium';
  const disabled = props.disabled ? ' disabled' : '';
  const fullWidth = props.fullWidth;

  // Button styles
  const buttonStyles: Record<string, string> = {
    display: fullWidth ? 'block' : 'inline-block',
    width: fullWidth ? '100%' : 'auto',
    fontWeight: '500',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    userSelect: 'none',
    borderRadius: '6px',
    transition: 'all 0.2s',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? '0.65' : '1',
    border: 'none',
    ...getButtonVariantStyles(variant),
    ...getButtonSizeStyles(size),
  };

  const mergedStyles = mergeStyles(buttonStyles, styles);
  const inlineStyle = generateInlineStyle(mergedStyles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  // Handle onClick navigation
  let onClickAttr = '';
  const events = component.events || props.events || [];
  const clickEvent = events.find?.((e: any) => e.eventType === 'onClick');
  if (clickEvent?.action?.type === 'navigate' && clickEvent?.action?.config?.url) {
    // Convert route paths to HTML file links for static export
    const navUrl = routeToHtmlLink(clickEvent.action.config.url);
    onClickAttr = ` onclick="window.location.href='${navUrl}'"`;
  }

  return `${indent}<button id="${id}" class="component button btn-${variant} btn-${size}"${styleAttr}${disabled}${onClickAttr}>${escapeHtml(text)}</button>`;
}

function getButtonVariantStyles(variant: string): Record<string, string> {
  const variants: Record<string, Record<string, string>> = {
    primary: { backgroundColor: '#007bff', color: 'white' },
    secondary: { backgroundColor: '#6c757d', color: 'white' },
    success: { backgroundColor: '#28a745', color: 'white' },
    danger: { backgroundColor: '#dc3545', color: 'white' },
    warning: { backgroundColor: '#ffc107', color: '#212529' },
    outline: { backgroundColor: 'transparent', color: '#007bff', border: '2px solid #007bff' },
    'outline-light': { backgroundColor: 'transparent', color: '#ffffff', border: '2px solid #ffffff' },
    link: { backgroundColor: 'transparent', color: '#007bff', textDecoration: 'underline' },
  };
  return variants[variant] || variants.primary;
}

function getButtonSizeStyles(size: string): Record<string, string> {
  const sizes: Record<string, Record<string, string>> = {
    small: { padding: '6px 12px', fontSize: '13px' },
    medium: { padding: '8px 16px', fontSize: '14px' },
    large: { padding: '12px 24px', fontSize: '16px' },
  };
  return sizes[size] || sizes.medium;
}

/**
 * Generate Image HTML
 */
function generateImageHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles } = component;
  const src = props.src || props.url || 'https://via.placeholder.com/300x200';
  const alt = props.alt || '';

  const imageStyles: Record<string, string> = {
    maxWidth: '100%',
    height: 'auto',
    display: 'block',
  };

  const mergedStyles = mergeStyles(imageStyles, styles);
  const inlineStyle = generateInlineStyle(mergedStyles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  return `${indent}<img id="${id}" class="component image" src="${src}" alt="${escapeHtml(alt)}"${styleAttr} />`;
}

/**
 * Generate Textbox HTML (rich text content)
 */
function generateTextboxHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles } = component;
  const content = props.content || props.text || '';

  const inlineStyle = generateInlineStyle(styles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  // Content might contain HTML, so don't escape it
  return `${indent}<div id="${id}" class="component textbox"${styleAttr}>${content}</div>`;
}

/**
 * Generate Container HTML with proper layout styles
 * Priority: component.styles > props.layoutType/layoutMode > defaults
 */
function generateContainerHTML(component: ComponentInstance, id: string, indent: string, depth: number): string {
  const { props, styles, children, componentId } = component;

  // Always get layout styles from props (layoutType or layoutMode)
  // These provide the base layout, then styles can override
  const layoutStyles = getContainerLayoutStyles(props);

  // Container base styles - start with layout styles
  const containerStyles: Record<string, string> = {
    ...layoutStyles,
  };

  // Apply gap - check styles first, then props
  if (styles.gap) {
    containerStyles.gap = styles.gap;
  } else if (props.gap) {
    containerStyles.gap = props.gap;
  }

  // Apply padding - check styles first, then props
  if (styles.padding) {
    containerStyles.padding = styles.padding;
  } else if (props.padding) {
    containerStyles.padding = props.padding;
  }

  // Apply backgroundColor
  if (styles.backgroundColor) {
    containerStyles.backgroundColor = styles.backgroundColor;
  } else if (props.backgroundColor) {
    containerStyles.backgroundColor = props.backgroundColor;
  }

  // Apply borderRadius
  if (styles.borderRadius) {
    containerStyles.borderRadius = styles.borderRadius;
  }

  // Apply minHeight
  if (styles.minHeight) {
    containerStyles.minHeight = styles.minHeight;
  } else if (props.minHeight) {
    containerStyles.minHeight = props.minHeight;
  }

  // Add box shadow if present
  if (styles.boxShadow) {
    containerStyles.boxShadow = styles.boxShadow;
  }

  // Apply maxWidth and centering
  if (styles.maxWidth || props.maxWidth) {
    containerStyles.maxWidth = styles.maxWidth || props.maxWidth;
  }
  if (props.centerContent || styles.marginLeft === 'auto') {
    containerStyles.marginLeft = 'auto';
    containerStyles.marginRight = 'auto';
  }

  // Apply flex alignment properties
  if (styles.alignItems || props.alignItems) {
    containerStyles.alignItems = styles.alignItems || props.alignItems;
  }
  if (styles.justifyContent || props.justifyContent) {
    containerStyles.justifyContent = styles.justifyContent || props.justifyContent;
  }
  if (styles.flexWrap || props.flexWrap) {
    containerStyles.flexWrap = styles.flexWrap || props.flexWrap;
  }

  // Apply width - important for container sizing
  if (styles.width) {
    containerStyles.width = styles.width;
  }

  // Apply flex properties for child sizing in flex containers
  if (styles.flex) {
    containerStyles.flex = styles.flex;
  }
  if (styles.minWidth) {
    containerStyles.minWidth = styles.minWidth;
  }

  // Apply text alignment
  if (styles.textAlign) {
    containerStyles.textAlign = styles.textAlign;
  }

  // Handle ScrollableContainer
  if (componentId === 'ScrollableContainer') {
    containerStyles.overflow = 'auto';
    if (props.maxHeight) containerStyles.maxHeight = props.maxHeight;
  }

  // Merge: containerStyles (base) + all styles from component (overrides)
  // This ensures component.styles takes precedence for any property
  const mergedStyles = mergeStyles(containerStyles, styles);
  const inlineStyle = generateInlineStyle(mergedStyles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  // Generate children HTML
  const childrenHtml = (children || [])
    .map(child => generateComponentHTML(child, depth + 1))
    .join('\n');

  const containerClass = componentId === 'ScrollableContainer'
    ? 'component container scrollable-container'
    : 'component container';

  if (childrenHtml) {
    return `${indent}<div id="${id}" class="${containerClass}"${styleAttr}>\n${childrenHtml}\n${indent}</div>`;
  }
  return `${indent}<div id="${id}" class="${containerClass}"${styleAttr}></div>`;
}

/**
 * Convert a route path to an HTML file link for static export
 * - "/" becomes "index.html"
 * - "/home" or "home" becomes "index.html" (home page is saved as index.html)
 * - "/about" becomes "about.html"
 * - "#section" stays as "#section" (anchor links)
 * - External URLs (http/https) stay unchanged
 */
function routeToHtmlLink(route: string): string {
  if (!route || route === '#') {
    return '#';
  }

  // Keep anchor links as-is
  if (route.startsWith('#')) {
    return route;
  }

  // Keep external URLs as-is
  if (route.startsWith('http://') || route.startsWith('https://')) {
    return route;
  }

  // Convert route paths to HTML files
  // Home page is saved as index.html, so handle all variations
  if (route === '/' || route === '/home' || route === 'home') {
    return 'index.html';
  }

  // Remove leading slash and add .html extension
  const pageName = route.startsWith('/') ? route.substring(1) : route;
  return `${pageName}.html`;
}

/**
 * Generate Navbar HTML
 * Preserves the exact same content, styling, and behavior from the preview
 */
function generateNavbarHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles, componentId } = component;

  // Extract brand text - check all possible prop names (brandText is used by NavbarRenderer)
  const brandName = props.brandText || props.brandName || props.brand || 'Brand';
  const brandLink = props.brandLink || '/';
  const brandImageUrl = props.brandImageUrl || '';
  const navItems = props.navItems || props.items || [];
  const layout = props.layout || 'default';
  const sticky = props.sticky || false;

  // Extract style props from component.styles (same as NavbarRenderer does)
  const backgroundColor = styles.backgroundColor || '#ffffff';
  const textColor = styles.textColor || styles.color || '#333333';
  const accentColor = styles.accentColor || '#007bff';
  const padding = styles.padding || '0 20px';
  const boxShadow = styles.boxShadow || '0 2px 4px rgba(0,0,0,0.1)';
  const borderBottom = styles.borderBottom || '1px solid #e0e0e0';
  const fontFamily = styles.fontFamily || 'inherit';
  const fontSize = styles.fontSize || '16px';
  const backdropFilter = styles.backdropFilter || '';

  // Build navbar container styles
  const navbarStyles: Record<string, string> = {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: '40px',
    backgroundColor,
    color: textColor,
    padding,
    boxShadow,
    borderBottom,
    fontFamily,
    fontSize,
    boxSizing: 'border-box',
    transition: 'all 0.3s ease',
  };

  // Get justify-content based on layout
  switch (layout) {
    case 'centered':
      navbarStyles.justifyContent = 'center';
      break;
    case 'split':
    case 'default':
    default:
      navbarStyles.justifyContent = 'space-between';
      break;
  }

  if (sticky) {
    navbarStyles.position = 'sticky';
    navbarStyles.top = '0';
    navbarStyles.zIndex = '1000';
  }

  if (backdropFilter) {
    navbarStyles.backdropFilter = backdropFilter;
  }

  const inlineStyle = generateInlineStyle(navbarStyles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  // Parse navItems if it's a string (JSON)
  let parsedNavItems = navItems;
  if (typeof navItems === 'string') {
    try {
      parsedNavItems = JSON.parse(navItems);
    } catch (e) {
      console.warn('Failed to parse navItems:', e);
      parsedNavItems = [];
    }
  }
  if (!Array.isArray(parsedNavItems)) {
    parsedNavItems = [];
  }

  // Generate nav items HTML with proper styling
  const navItemsHtml = parsedNavItems.map((item: any) => {
    const href = routeToHtmlLink(item.href || '#');
    const isActive = item.active;
    const linkStyles = [
      'display: flex',
      'align-items: center',
      'padding: 8px 12px',
      'text-decoration: none',
      `color: ${isActive ? accentColor : textColor}`,
      `font-weight: ${isActive ? '600' : '400'}`,
      `border-bottom: 2px solid ${isActive ? accentColor : 'transparent'}`,
      'transition: all 0.2s ease',
      'white-space: nowrap',
    ].join('; ');

    return `${indent}      <li style="margin: 0; list-style: none;"><a href="${href}" style="${linkStyles}">${escapeHtml(item.label || item.text || '')}</a></li>`;
  }).join('\n');

  // Convert brand link to HTML file link
  const brandHref = routeToHtmlLink(brandLink);

  // Brand styles
  const brandStyles = [
    'display: flex',
    'align-items: center',
    'gap: 10px',
    'text-decoration: none',
    `color: ${textColor}`,
    'font-weight: 600',
    'font-size: 1.25em',
  ].join('; ');

  // Build brand HTML (with optional image)
  let brandHtml = '';
  if (brandImageUrl) {
    brandHtml += `<img src="${brandImageUrl}" alt="${escapeHtml(brandName)}" style="height: 32px; width: auto;" />`;
  }
  if (brandName) {
    brandHtml += `<span>${escapeHtml(brandName)}</span>`;
  }

  // Hamburger toggle styles
  const hamburgerStyles = [
    'display: none',
    'flex-direction: column',
    'justify-content: space-around',
    'width: 24px',
    'height: 20px',
    'background: transparent',
    'border: none',
    'cursor: pointer',
    'padding: 0',
  ].join('; ');

  const hamburgerLineStyles = [
    'width: 24px',
    'height: 3px',
    `background-color: ${textColor}`,
    'border-radius: 2px',
    'transition: all 0.3s ease',
  ].join('; ');

  return `${indent}<nav id="${id}" class="component navbar"${styleAttr}>
${indent}  <a href="${brandHref}" style="${brandStyles}">${brandHtml}</a>
${layout === 'split' ? `${indent}  <div style="flex: 1;"></div>\n` : ''}${indent}  <ul style="display: flex; list-style: none; margin: 0; padding: 0; gap: 8px; align-items: center;">
${navItemsHtml}
${indent}  </ul>
${indent}  <button class="navbar-toggle" style="${hamburgerStyles}" aria-label="Toggle navigation menu">
${indent}    <span style="${hamburgerLineStyles}"></span>
${indent}    <span style="${hamburgerLineStyles}"></span>
${indent}    <span style="${hamburgerLineStyles}"></span>
${indent}  </button>
${indent}</nav>`;
}

/**
 * Generate generic HTML for unknown components
 */
function generateGenericHTML(component: ComponentInstance, id: string, indent: string, depth: number): string {
  const { props, styles, children, componentId } = component;

  const inlineStyle = generateInlineStyle(styles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  if (children && children.length > 0) {
    const childrenHtml = children.map(child => generateComponentHTML(child, depth + 1)).join('\n');
    return `${indent}<div id="${id}" class="component ${componentId.toLowerCase()}"${styleAttr}>\n${childrenHtml}\n${indent}</div>`;
  }

  const text = props.text || props.content || '';
  return `${indent}<div id="${id}" class="component ${componentId.toLowerCase()}"${styleAttr}>${escapeHtml(text)}</div>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return String(text || '');
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, char => htmlEntities[char]);
}

/**
 * Generate the base CSS for all components
 */
function generateBaseCSS(): string {
  return `/* Base Styles - Generated by Visual Site Builder */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  width: 100%;
  min-height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  line-height: 1.6;
  color: #333;
}

.page-content {
  width: 100%;
  min-height: 100vh;
}

.component {
  position: relative;
}

/* Container defaults - only apply width: 100% to direct children of page-content */
/* This allows nested containers in flex-row layouts to size based on content */
.page-content > .container {
  width: 100%;
}

/* Image defaults */
.image {
  max-width: 100%;
  height: auto;
}

/* Textbox defaults */
.textbox {
  word-wrap: break-word;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .navbar ul {
    display: none !important;
    flex-direction: column !important;
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: 0 !important;
    background: inherit !important;
    padding: 1rem !important;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important;
  }

  .navbar ul.active {
    display: flex !important;
  }

  .navbar .navbar-toggle {
    display: block !important;
  }

  /* Stack grid columns on mobile */
  .container[style*="grid-template-columns"] {
    grid-template-columns: 1fr !important;
  }

  /* Stack flex rows on mobile */
  .container[style*="flex-direction: row"] {
    flex-direction: column !important;
  }
}
`;
}

/**
 * Generate JavaScript for interactive features
 */
function generateBaseJS(): string {
  return `// Site JavaScript - Generated by Visual Site Builder

document.addEventListener('DOMContentLoaded', function() {
  // Mobile navbar toggle
  const navbarToggles = document.querySelectorAll('.navbar-toggle');
  navbarToggles.forEach(function(toggle) {
    toggle.addEventListener('click', function() {
      const navbar = this.closest('.navbar, nav');
      const navList = navbar.querySelector('ul');
      if (navList) {
        navList.classList.toggle('active');
      }
    });
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href && href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Handle hover states for buttons
  document.querySelectorAll('.button').forEach(function(btn) {
    const originalBg = btn.style.backgroundColor;
    btn.addEventListener('mouseenter', function() {
      if (!this.disabled) {
        this.style.filter = 'brightness(0.9)';
      }
    });
    btn.addEventListener('mouseleave', function() {
      this.style.filter = 'none';
    });
  });

  console.log('Site loaded successfully!');
});
`;
}

/**
 * Generate a complete HTML page
 */
function generateHTMLPage(
  pageDefinition: PageDefinition,
  pageMeta: Page,
  allPages: Page[],
  options: ExportOptions
): string {
  const { pageName, components, globalStyles } = pageDefinition;

  // Generate component HTML
  const componentsHtml = components
    .map(comp => generateComponentHTML(comp, 2))
    .join('\n\n');

  // Generate custom CSS
  let customCss = '';
  if (globalStyles?.customCSS) {
    customCss = `\n  <style>\n${globalStyles.customCSS}\n  </style>`;
  }

  // Determine CSS and JS includes
  const cssInclude = options.includeCss
    ? '  <link rel="stylesheet" href="css/styles.css">'
    : `  <style>\n${generateBaseCSS()}\n  </style>`;
  const jsInclude = options.includeJs
    ? '  <script src="js/main.js" defer></script>'
    : `  <script>\n${generateBaseJS()}\n  </script>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageName)}</title>
${cssInclude}${customCss}
</head>
<body>
  <main class="page-content">
${componentsHtml}
  </main>
${jsInclude}
</body>
</html>`;
}

/**
 * Convert a blob to base64 data URL
 */
async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Export a single page as HTML (async to handle image embedding)
 */
export async function exportSinglePage(
  pageDefinition: PageDefinition,
  options: Partial<ExportOptions> = {}
): Promise<string> {
  const defaultOptions: ExportOptions = {
    includeCss: false,
    includeJs: false,
    minify: false,
    singlePage: true,
  };
  const mergedOptions = { ...defaultOptions, ...options };

  const pageMeta: Page = {
    id: 1,
    siteId: 0,
    pageName: pageDefinition.pageName,
    pageSlug: pageDefinition.pageName.toLowerCase().replace(/\s+/g, '-'),
    pageType: 'standard',
    routePath: '/',
    displayOrder: 0,
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let html = generateHTMLPage(pageDefinition, pageMeta, [pageMeta], mergedOptions);

  // Collect all image URLs and embed them as base64 data URLs
  const imageUrls = collectImageUrls(pageDefinition.components);

  if (imageUrls.size > 0) {
    const urlMap = new Map<string, string>();

    // Fetch all images and convert to data URLs
    const promises = Array.from(imageUrls).map(async (url) => {
      const blob = await fetchImageAsBlob(url);
      if (blob) {
        const dataUrl = await blobToDataUrl(blob);
        urlMap.set(url, dataUrl);
      }
    });

    await Promise.all(promises);

    // Replace URLs in HTML
    html = replaceImageUrls(html, urlMap);
  }

  return html;
}

/**
 * Collect all image URLs from a component tree
 * Handles both absolute URLs (http://...) and relative paths (/uploads/...)
 */
function collectImageUrls(components: ComponentInstance[]): Set<string> {
  const urls = new Set<string>();

  const processComponent = (component: ComponentInstance) => {
    // Check for image src in props
    const src = component.props?.src || component.props?.url;
    if (src && typeof src === 'string' && src.trim() !== '') {
      // Include both absolute URLs and relative paths (like /uploads/...)
      // Exclude placeholder URLs and empty values
      if (src.startsWith('http') || src.startsWith('/')) {
        urls.add(src);
      }
    }

    // Also check for background images in styles
    const bgImage = component.styles?.backgroundImage;
    if (bgImage && typeof bgImage === 'string') {
      // Match both absolute and relative URLs in background-image
      const urlMatch = bgImage.match(/url\(['"]?([^'")\s]+)['"]?\)/);
      if (urlMatch && urlMatch[1]) {
        const bgUrl = urlMatch[1];
        if (bgUrl.startsWith('http') || bgUrl.startsWith('/')) {
          urls.add(bgUrl);
        }
      }
    }

    // Process children recursively
    if (component.children) {
      component.children.forEach(processComponent);
    }
  };

  components.forEach(processComponent);
  return urls;
}

/**
 * Generate a safe filename from a URL
 */
function urlToFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Get the last part of the path and sanitize it
    let filename = pathname.split('/').pop() || 'image';

    // If no extension, try to add one based on common patterns
    if (!filename.includes('.')) {
      filename += '.png';
    }

    // Sanitize the filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

    return filename;
  } catch {
    // Fallback for invalid URLs
    return `image_${Date.now()}.png`;
  }
}

/**
 * Convert a relative URL to absolute URL using current origin
 */
function toAbsoluteUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // For relative paths like /uploads/..., prepend the current origin
  if (url.startsWith('/')) {
    return `${window.location.origin}${url}`;
  }
  // For other relative paths, use current location as base
  return new URL(url, window.location.href).href;
}

/**
 * Fetch an image and return it as a blob
 * Handles both absolute URLs and relative paths
 */
async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    // Convert relative URLs to absolute
    const absoluteUrl = toAbsoluteUrl(url);

    const response = await fetch(absoluteUrl, {
      mode: 'cors',
      credentials: 'include', // Include cookies for same-origin requests
    });
    if (!response.ok) {
      console.warn(`Failed to fetch image: ${absoluteUrl} (${response.status})`);
      return null;
    }
    return await response.blob();
  } catch (err) {
    console.warn(`Failed to fetch image: ${url}`, err);
    return null;
  }
}

/**
 * Replace image URLs in HTML with local paths
 */
function replaceImageUrls(html: string, urlMap: Map<string, string>): string {
  let result = html;
  urlMap.forEach((localPath, originalUrl) => {
    // Escape special regex characters in the URL
    const escapedUrl = originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(new RegExp(escapedUrl, 'g'), localPath);
  });
  return result;
}

/**
 * Export entire site as a ZIP file
 */
export async function exportSiteAsZip(
  siteData: SiteExportData,
  options: Partial<ExportOptions> = {}
): Promise<Blob> {
  const defaultOptions: ExportOptions = {
    includeCss: true,
    includeJs: true,
    minify: false,
    singlePage: false,
  };
  const mergedOptions = { ...defaultOptions, ...options };

  const zip = new JSZip();

  // Add CSS file
  if (mergedOptions.includeCss) {
    zip.file('css/styles.css', generateBaseCSS());
  }

  // Add JS file
  if (mergedOptions.includeJs) {
    zip.file('js/main.js', generateBaseJS());
  }

  // Collect all image URLs from all pages
  const allImageUrls = new Set<string>();
  for (const { definition } of siteData.pages) {
    const pageUrls = collectImageUrls(definition.components);
    pageUrls.forEach(url => allImageUrls.add(url));
  }

  // Fetch images and create URL mapping
  const urlMap = new Map<string, string>();
  const imagePromises: Promise<void>[] = [];

  allImageUrls.forEach(url => {
    const filename = urlToFilename(url);
    const localPath = `images/${filename}`;
    urlMap.set(url, localPath);

    const promise = fetchImageAsBlob(url).then(blob => {
      if (blob) {
        zip.file(localPath, blob);
      }
    });
    imagePromises.push(promise);
  });

  // Wait for all images to be fetched
  await Promise.all(imagePromises);

  // Generate HTML for each page (with updated image paths)
  const allPages = siteData.pages.map(p => p.page);

  for (const { page, definition } of siteData.pages) {
    let html = generateHTMLPage(definition, page, allPages, mergedOptions);
    // Replace image URLs with local paths
    html = replaceImageUrls(html, urlMap);
    const fileName = page.routePath === '/'
      ? 'index.html'
      : `${page.pageSlug}.html`;
    zip.file(fileName, html);
  }

  // Add a simple README
  const readme = `# ${siteData.siteName}

This site was exported from Visual Site Builder.

## Files
${siteData.pages.map(p => `- ${p.page.routePath === '/' ? 'index.html' : p.page.pageSlug + '.html'} - ${p.page.pageName}`).join('\n')}
${urlMap.size > 0 ? `\n## Images\n${urlMap.size} image(s) included in the images/ folder.\n` : ''}
## Deployment
Upload all files to your web server or hosting service.

### Quick Deploy Options:
1. **Netlify Drop**: Drag and drop this folder to netlify.com/drop
2. **GitHub Pages**: Push to a GitHub repository and enable Pages
3. **Vercel**: Import to vercel.com
4. **Any Web Server**: Upload via FTP/SFTP

## Generated
Date: ${new Date().toISOString()}
Tool: Visual Site Builder
`;
  zip.file('README.md', readme);

  // Generate the zip file
  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Export site from localStorage (demo mode)
 */
export async function exportDemoSite(siteName: string = 'My Site'): Promise<Blob> {
  const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');

  const pages: SiteExportData['pages'] = Object.entries(savedPages).map(
    ([slug, definition]: [string, any], index) => ({
      page: {
        id: index + 1,
        siteId: 0,
        pageName: definition.pageName || slug,
        pageSlug: slug,
        pageType: slug === 'home' ? 'homepage' : 'standard',
        routePath: slug === 'home' ? '/' : `/${slug}`,
        displayOrder: index,
        isPublished: false,
        createdAt: definition.savedAt || new Date().toISOString(),
        updatedAt: definition.savedAt || new Date().toISOString(),
      } as Page,
      definition: definition as PageDefinition,
    })
  );

  // Ensure we have at least one page
  if (pages.length === 0) {
    throw new Error('No pages to export. Please create and save at least one page.');
  }

  return exportSiteAsZip({ pages, siteName });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download HTML string as a file
 */
export function downloadHTML(html: string, filename: string): void {
  const blob = new Blob([html], { type: 'text/html' });
  downloadBlob(blob, filename);
}
