import api from './api';
import {
  Site,
  CreateSiteRequest,
  UpdateSiteRequest,
  Layout,
  CreateLayoutRequest,
  UpdateLayoutRequest,
  GlobalStyle,
  CreateGlobalStyleRequest,
  UpdateGlobalStyleRequest,
  NavigationMenu
} from '../types/site';

/**
 * Site Management API Service
 */
export const siteService = {
  // ========== Site CRUD ==========

  /**
   * Get all sites for current user
   */
  getAllSites: async (): Promise<Site[]> => {
    const response = await api.get<Site[]>('/sites');
    return response.data;
  },

  /**
   * Get a site by ID
   */
  getSiteById: async (id: number): Promise<Site> => {
    const response = await api.get<Site>(`/sites/${id}`);
    return response.data;
  },

  /**
   * Get a site by slug
   */
  getSiteBySlug: async (slug: string): Promise<Site> => {
    const response = await api.get<Site>(`/sites/slug/${slug}`);
    return response.data;
  },

  /**
   * Create a new site
   */
  createSite: async (siteData: CreateSiteRequest): Promise<Site> => {
    const response = await api.post<Site>('/sites', siteData);
    return response.data;
  },

  /**
   * Update a site
   */
  updateSite: async (id: number, siteData: UpdateSiteRequest): Promise<Site> => {
    const response = await api.put<Site>(`/sites/${id}`, siteData);
    return response.data;
  },

  /**
   * Delete a site
   */
  deleteSite: async (id: number): Promise<void> => {
    await api.delete(`/sites/${id}`);
  },

  /**
   * Publish a site
   */
  publishSite: async (id: number): Promise<Site> => {
    const response = await api.post<Site>(`/sites/${id}/publish`);
    return response.data;
  },

  /**
   * Unpublish a site
   */
  unpublishSite: async (id: number): Promise<Site> => {
    const response = await api.post<Site>(`/sites/${id}/unpublish`);
    return response.data;
  },

  // ========== Layout Management ==========

  /**
   * Get all layouts for a site
   */
  getLayouts: async (siteId: number): Promise<Layout[]> => {
    const response = await api.get<Layout[]>(`/sites/${siteId}/layouts`);
    return response.data;
  },

  /**
   * Get a layout by ID
   */
  getLayoutById: async (siteId: number, layoutId: number): Promise<Layout> => {
    const response = await api.get<Layout>(`/sites/${siteId}/layouts/${layoutId}`);
    return response.data;
  },

  /**
   * Create a new layout
   */
  createLayout: async (siteId: number, layoutData: CreateLayoutRequest): Promise<Layout> => {
    const response = await api.post<Layout>(`/sites/${siteId}/layouts`, layoutData);
    return response.data;
  },

  /**
   * Update a layout
   */
  updateLayout: async (siteId: number, layoutId: number, layoutData: UpdateLayoutRequest): Promise<Layout> => {
    const response = await api.put<Layout>(`/sites/${siteId}/layouts/${layoutId}`, layoutData);
    return response.data;
  },

  /**
   * Delete a layout
   */
  deleteLayout: async (siteId: number, layoutId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/layouts/${layoutId}`);
  },

  // ========== Global Styles ==========

  /**
   * Get all global styles for a site
   */
  getGlobalStyles: async (siteId: number): Promise<GlobalStyle[]> => {
    const response = await api.get<GlobalStyle[]>(`/sites/${siteId}/global-styles`);
    return response.data;
  },

  /**
   * Get active global style for a site
   */
  getActiveGlobalStyle: async (siteId: number): Promise<GlobalStyle> => {
    const response = await api.get<GlobalStyle>(`/sites/${siteId}/global-styles/active`);
    return response.data;
  },

  /**
   * Create a new global style
   */
  createGlobalStyle: async (siteId: number, styleData: CreateGlobalStyleRequest): Promise<GlobalStyle> => {
    const response = await api.post<GlobalStyle>(`/sites/${siteId}/global-styles`, styleData);
    return response.data;
  },

  /**
   * Update a global style
   */
  updateGlobalStyle: async (siteId: number, styleId: number, styleData: UpdateGlobalStyleRequest): Promise<GlobalStyle> => {
    const response = await api.put<GlobalStyle>(`/sites/${siteId}/global-styles/${styleId}`, styleData);
    return response.data;
  },

  /**
   * Activate a global style
   */
  activateGlobalStyle: async (siteId: number, styleId: number): Promise<GlobalStyle> => {
    const response = await api.post<GlobalStyle>(`/sites/${siteId}/global-styles/${styleId}/activate`);
    return response.data;
  },

  /**
   * Delete a global style
   */
  deleteGlobalStyle: async (siteId: number, styleId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/global-styles/${styleId}`);
  },

  // ========== Navigation Menus ==========

  /**
   * Get all navigation menus for a site
   */
  getNavigationMenus: async (siteId: number): Promise<NavigationMenu[]> => {
    const response = await api.get<NavigationMenu[]>(`/sites/${siteId}/navigation`);
    return response.data;
  },

  /**
   * Get active navigation menu by type
   */
  getActiveNavigationByType: async (siteId: number, menuType: string): Promise<NavigationMenu> => {
    const response = await api.get<NavigationMenu>(`/sites/${siteId}/navigation/type/${menuType}/active`);
    return response.data;
  },

  /**
   * Create a navigation menu
   */
  createNavigationMenu: async (siteId: number, menuData: Partial<NavigationMenu>): Promise<NavigationMenu> => {
    const response = await api.post<NavigationMenu>(`/sites/${siteId}/navigation`, menuData);
    return response.data;
  },

  /**
   * Update a navigation menu
   */
  updateNavigationMenu: async (siteId: number, menuId: number, menuData: Partial<NavigationMenu>): Promise<NavigationMenu> => {
    const response = await api.put<NavigationMenu>(`/sites/${siteId}/navigation/${menuId}`, menuData);
    return response.data;
  },

  /**
   * Delete a navigation menu
   */
  deleteNavigationMenu: async (siteId: number, menuId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/navigation/${menuId}`);
  }
};
