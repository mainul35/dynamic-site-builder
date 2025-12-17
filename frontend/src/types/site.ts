/**
 * TypeScript types for Site and Page entities
 */

/**
 * Site mode types
 */
export type SiteMode = 'single_page' | 'multi_page' | 'full_site';

/**
 * Page type
 */
export type PageType = 'standard' | 'template' | 'homepage';

/**
 * Layout type
 */
export type LayoutType = 'full' | 'header' | 'footer' | 'sidebar';

/**
 * Menu type
 */
export type MenuType = 'header' | 'footer' | 'sidebar' | 'custom';

/**
 * Site entity
 */
export interface Site {
  id: number;
  siteName: string;
  siteSlug: string;
  siteMode: SiteMode;
  description?: string;
  ownerUserId: number;
  isPublished: boolean;
  domainName?: string;
  faviconUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Page entity
 */
export interface Page {
  id: number;
  siteId: number;
  pageName: string;
  pageSlug: string;
  pageType: PageType;
  title?: string;
  description?: string;
  routePath?: string;
  parentPageId?: number;
  displayOrder: number;
  isPublished: boolean;
  layoutId?: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

/**
 * Page version entity
 */
export interface PageVersion {
  id: number;
  pageId: number;
  versionNumber: number;
  pageDefinition: string; // JSON string of PageDefinition
  changeDescription?: string;
  createdByUserId?: number;
  createdAt: string;
  isActive: boolean;
}

/**
 * Layout entity
 */
export interface Layout {
  id: number;
  siteId: number;
  layoutName: string;
  layoutType: LayoutType;
  layoutDefinition: string; // JSON string
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Global style entity
 */
export interface GlobalStyle {
  id: number;
  siteId: number;
  styleName: string;
  cssVariables?: Record<string, string>;
  globalCss?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Navigation menu entity
 */
export interface NavigationMenu {
  id: number;
  siteId: number;
  menuName: string;
  menuType: MenuType;
  menuItems: NavigationItem[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Navigation menu item
 */
export interface NavigationItem {
  id: string;
  label: string;
  pageId?: number;
  routePath?: string;
  externalUrl?: string;
  children?: NavigationItem[];
}

/**
 * Request types for API calls
 */
export interface CreateSiteRequest {
  siteName: string;
  siteSlug: string;
  siteMode: SiteMode;
  description?: string;
}

export interface UpdateSiteRequest {
  siteName?: string;
  description?: string;
  domainName?: string;
  faviconUrl?: string;
  metadata?: Record<string, any>;
}

export interface CreatePageRequest {
  pageName: string;
  pageSlug: string;
  pageType?: PageType;
  title?: string;
  description?: string;
  routePath?: string;
  parentPageId?: number;
  layoutId?: number;
}

export interface UpdatePageRequest {
  pageName?: string;
  title?: string;
  description?: string;
  routePath?: string;
  parentPageId?: number;
  layoutId?: number;
  displayOrder?: number;
}

export interface CreateLayoutRequest {
  layoutName: string;
  layoutType: LayoutType;
  layoutDefinition: string;
  isDefault?: boolean;
}

export interface UpdateLayoutRequest {
  layoutName?: string;
  layoutDefinition?: string;
  isDefault?: boolean;
}

export interface CreateGlobalStyleRequest {
  styleName: string;
  cssVariables?: Record<string, string>;
  globalCss?: string;
}

export interface UpdateGlobalStyleRequest {
  styleName?: string;
  cssVariables?: Record<string, string>;
  globalCss?: string;
}
