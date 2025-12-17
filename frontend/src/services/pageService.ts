import api from './api';
import {
  Page,
  PageVersion,
  CreatePageRequest,
  UpdatePageRequest
} from '../types/site';
import { PageDefinition } from '../types/builder';

/**
 * Page Management API Service
 */
export const pageService = {
  // ========== Page CRUD ==========

  /**
   * Get all pages for a site
   */
  getAllPages: async (siteId: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/sites/${siteId}/pages`);
    return response.data;
  },

  /**
   * Get a page by ID
   */
  getPageById: async (siteId: number, pageId: number): Promise<Page> => {
    const response = await api.get<Page>(`/sites/${siteId}/pages/${pageId}`);
    return response.data;
  },

  /**
   * Get a page by slug
   */
  getPageBySlug: async (siteId: number, slug: string): Promise<Page> => {
    const response = await api.get<Page>(`/sites/${siteId}/pages/slug/${slug}`);
    return response.data;
  },

  /**
   * Create a new page
   */
  createPage: async (siteId: number, pageData: CreatePageRequest): Promise<Page> => {
    const response = await api.post<Page>(`/sites/${siteId}/pages`, pageData);
    return response.data;
  },

  /**
   * Update a page
   */
  updatePage: async (siteId: number, pageId: number, pageData: UpdatePageRequest): Promise<Page> => {
    const response = await api.put<Page>(`/sites/${siteId}/pages/${pageId}`, pageData);
    return response.data;
  },

  /**
   * Delete a page
   */
  deletePage: async (siteId: number, pageId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/pages/${pageId}`);
  },

  /**
   * Publish a page
   */
  publishPage: async (siteId: number, pageId: number): Promise<Page> => {
    const response = await api.post<Page>(`/sites/${siteId}/pages/${pageId}/publish`);
    return response.data;
  },

  /**
   * Unpublish a page
   */
  unpublishPage: async (siteId: number, pageId: number): Promise<Page> => {
    const response = await api.post<Page>(`/sites/${siteId}/pages/${pageId}/unpublish`);
    return response.data;
  },

  /**
   * Duplicate a page
   */
  duplicatePage: async (siteId: number, pageId: number, newPageName?: string): Promise<Page> => {
    const response = await api.post<Page>(`/sites/${siteId}/pages/${pageId}/duplicate`, {
      newPageName
    });
    return response.data;
  },

  // ========== Page Version Management ==========

  /**
   * Get all versions for a page
   */
  getPageVersions: async (siteId: number, pageId: number): Promise<PageVersion[]> => {
    const response = await api.get<PageVersion[]>(`/sites/${siteId}/pages/${pageId}/versions`);
    return response.data;
  },

  /**
   * Get a specific page version
   */
  getPageVersion: async (siteId: number, pageId: number, versionId: number): Promise<PageVersion> => {
    const response = await api.get<PageVersion>(
      `/sites/${siteId}/pages/${pageId}/versions/${versionId}`
    );
    return response.data;
  },

  /**
   * Get the active page version (latest)
   */
  getActivePageVersion: async (siteId: number, pageId: number): Promise<PageVersion> => {
    const response = await api.get<PageVersion>(`/sites/${siteId}/pages/${pageId}/versions/active`);
    return response.data;
  },

  /**
   * Get page definition from active version
   */
  getPageDefinition: async (siteId: number, pageId: number): Promise<PageDefinition> => {
    const response = await api.get<PageDefinition>(`/sites/${siteId}/pages/${pageId}/definition`);
    return response.data;
  },

  /**
   * Save a new page version
   */
  savePageVersion: async (
    siteId: number,
    pageId: number,
    pageDefinition: PageDefinition,
    changeDescription?: string
  ): Promise<PageVersion> => {
    const response = await api.post<PageVersion>(`/sites/${siteId}/pages/${pageId}/versions`, {
      pageDefinition: JSON.stringify(pageDefinition),
      changeDescription
    });
    return response.data;
  },

  /**
   * Restore a page to a specific version
   */
  restorePageVersion: async (siteId: number, pageId: number, versionId: number): Promise<PageVersion> => {
    const response = await api.post<PageVersion>(
      `/sites/${siteId}/pages/${pageId}/versions/${versionId}/restore`
    );
    return response.data;
  },

  /**
   * Delete a page version
   */
  deletePageVersion: async (siteId: number, pageId: number, versionId: number): Promise<void> => {
    await api.delete(`/sites/${siteId}/pages/${pageId}/versions/${versionId}`);
  },

  // ========== Page Hierarchy ==========

  /**
   * Get child pages of a parent page
   */
  getChildPages: async (siteId: number, parentPageId: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/sites/${siteId}/pages/${parentPageId}/children`);
    return response.data;
  },

  /**
   * Get page tree (hierarchical structure)
   */
  getPageTree: async (siteId: number): Promise<Page[]> => {
    const response = await api.get<Page[]>(`/sites/${siteId}/pages/tree`);
    return response.data;
  },

  /**
   * Reorder pages
   */
  reorderPages: async (
    siteId: number,
    pageOrders: Array<{ pageId: number; displayOrder: number }>
  ): Promise<void> => {
    await api.post(`/sites/${siteId}/pages/reorder`, { pageOrders });
  }
};
