import api from './api';
import { ComponentRegistryEntry, ComponentManifest } from '../types/builder';

/**
 * Component Registry API Service
 * Handles all API calls related to the component registry
 */
export const componentService = {
  /**
   * Get all available components
   */
  getAllComponents: async (): Promise<ComponentRegistryEntry[]> => {
    const response = await api.get<ComponentRegistryEntry[]>('/components');
    return response.data;
  },

  /**
   * Get components by category
   */
  getComponentsByCategory: async (category: string): Promise<ComponentRegistryEntry[]> => {
    const response = await api.get<ComponentRegistryEntry[]>(`/components/category/${category}`);
    return response.data;
  },

  /**
   * Get component manifest
   */
  getComponentManifest: async (pluginId: string, componentId: string): Promise<ComponentManifest> => {
    const response = await api.get<ComponentManifest>(
      `/components/${pluginId}/${componentId}/manifest`
    );
    return response.data;
  },

  /**
   * Search components by query
   */
  searchComponents: async (query: string): Promise<ComponentRegistryEntry[]> => {
    const response = await api.get<ComponentRegistryEntry[]>('/components/search', {
      params: { query }
    });
    return response.data;
  },

  /**
   * Get active components only
   */
  getActiveComponents: async (): Promise<ComponentRegistryEntry[]> => {
    const response = await api.get<ComponentRegistryEntry[]>('/components/active');
    return response.data;
  },

  /**
   * Get component thumbnail/icon
   */
  getComponentThumbnail: async (pluginId: string, componentId: string): Promise<Blob> => {
    const response = await api.get(`/components/${pluginId}/${componentId}/thumbnail`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get React component bundle
   */
  getComponentBundle: async (pluginId: string, componentId: string): Promise<string> => {
    const response = await api.get<string>(`/components/${pluginId}/${componentId}/bundle`);
    return response.data;
  },

  /**
   * Validate component props
   */
  validateComponentProps: async (
    pluginId: string,
    componentId: string,
    props: Record<string, any>
  ): Promise<{ isValid: boolean; errors?: string[] }> => {
    const response = await api.post(
      `/components/${pluginId}/${componentId}/validate-props`,
      props
    );
    return response.data;
  }
};
