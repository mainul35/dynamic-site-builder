import { PageDefinition, ComponentInstance } from '../types/builder';
import { Page } from '../types/site';
import JSZip from 'jszip';

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
 * Get container layout styles based on layoutType prop
 */
function getContainerLayoutStyles(props: Record<string, any>): Record<string, string> {
  const layoutType = props.layoutType || 'flex-column';
  const styles: Record<string, string> = {};

  switch (layoutType) {
    case 'flex-row':
      styles.display = 'flex';
      styles.flexDirection = 'row';
      styles.flexWrap = 'nowrap';
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

  // Handle different component types
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
    onClickAttr = ` onclick="window.location.href='${clickEvent.action.config.url}'"`;
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
 */
function generateContainerHTML(component: ComponentInstance, id: string, indent: string, depth: number): string {
  const { props, styles, children, componentId } = component;

  // Get layout styles from props
  const layoutStyles = getContainerLayoutStyles(props);

  // Container base styles
  const containerStyles: Record<string, string> = {
    ...layoutStyles,
    gap: styles.gap || props.gap || '16px',
    backgroundColor: styles.backgroundColor || props.backgroundColor || 'transparent',
    borderRadius: styles.borderRadius || '0',
    minHeight: props.minHeight || 'auto',
  };

  // Add box shadow if present
  if (styles.boxShadow) {
    containerStyles.boxShadow = styles.boxShadow;
  }

  // Handle ScrollableContainer
  if (componentId === 'ScrollableContainer') {
    containerStyles.overflow = 'auto';
    if (props.maxHeight) containerStyles.maxHeight = props.maxHeight;
  }

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
 * Generate Navbar HTML
 */
function generateNavbarHTML(component: ComponentInstance, id: string, indent: string): string {
  const { props, styles, componentId } = component;
  const brandName = props.brandName || props.brand || 'Brand';
  const navItems = props.navItems || props.items || [];
  const variant = componentId.replace('Navbar', '').toLowerCase() || props.variant || 'default';

  // Navbar styles based on variant
  const navbarStyles: Record<string, string> = {
    display: 'flex',
    alignItems: 'center',
    padding: '1rem',
    width: '100%',
  };

  // Apply variant-specific styles
  if (variant === 'dark' || componentId === 'NavbarDark') {
    navbarStyles.backgroundColor = '#1a1a2e';
    navbarStyles.color = '#ffffff';
  } else if (variant === 'glass' || componentId === 'NavbarGlass') {
    navbarStyles.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    navbarStyles.backdropFilter = 'blur(10px)';
  } else {
    navbarStyles.backgroundColor = '#ffffff';
    navbarStyles.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  }

  if (variant === 'sticky' || componentId === 'NavbarSticky') {
    navbarStyles.position = 'sticky';
    navbarStyles.top = '0';
    navbarStyles.zIndex = '100';
  }

  const mergedStyles = mergeStyles(navbarStyles, styles);
  const inlineStyle = generateInlineStyle(mergedStyles);
  const styleAttr = inlineStyle ? ` style="${inlineStyle}"` : '';

  const isDark = variant === 'dark' || componentId === 'NavbarDark';
  const linkColor = isDark ? '#ffffff' : '#666666';
  const brandColor = isDark ? '#ffffff' : '#333333';

  const navItemsHtml = navItems.map((item: any) => {
    const activeStyle = item.active ? 'color: #007bff; font-weight: 600;' : '';
    const href = item.href || '#';
    return `${indent}      <li style="margin: 0; list-style: none;"><a href="${href}" style="display: block; padding: 0.5rem 1rem; color: ${item.active ? '#007bff' : linkColor}; text-decoration: none; border-radius: 4px; transition: all 0.2s; ${activeStyle}">${escapeHtml(item.label || item.text || '')}</a></li>`;
  }).join('\n');

  return `${indent}<nav id="${id}" class="component navbar navbar-${variant}"${styleAttr}>
${indent}  <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 1200px; margin: 0 auto;">
${indent}    <a href="/" style="font-size: 1.25rem; font-weight: 700; color: ${brandColor}; text-decoration: none;">${escapeHtml(brandName)}</a>
${indent}    <button class="navbar-toggle" style="display: none; background: none; border: none; padding: 0.5rem; cursor: pointer;" aria-label="Toggle navigation">
${indent}      <span style="display: block; width: 24px; height: 2px; background-color: ${brandColor}; position: relative;"></span>
${indent}    </button>
${indent}    <ul style="display: flex; list-style: none; margin: 0; padding: 0; gap: 0.5rem;">
${navItemsHtml}
${indent}    </ul>
${indent}  </div>
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

/* Container defaults */
.container {
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
 * Export a single page as HTML
 */
export function exportSinglePage(
  pageDefinition: PageDefinition,
  options: Partial<ExportOptions> = {}
): string {
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

  return generateHTMLPage(pageDefinition, pageMeta, [pageMeta], mergedOptions);
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

  // Generate HTML for each page
  const allPages = siteData.pages.map(p => p.page);

  for (const { page, definition } of siteData.pages) {
    const html = generateHTMLPage(definition, page, allPages, mergedOptions);
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
