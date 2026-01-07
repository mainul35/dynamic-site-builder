import api from './api';

/**
 * Component registry entry from the backend
 */
export interface ComponentRegistryEntry {
  id: number;
  pluginId: string;
  componentId: string;
  componentName: string;
  category: string;
  icon: string | null;
  componentManifest: string; // JSON string
  reactBundlePath: string | null;
  isActive: boolean;
  registeredAt: string;
}

/**
 * Component manifest structure
 */
export interface ComponentManifest {
  componentId: string;
  displayName: string;
  category: string;
  icon?: string;
  description?: string;
  pluginId: string;
  pluginVersion?: string;
  canHaveChildren?: boolean;
  defaultProps?: Record<string, any>;
  defaultStyles?: Record<string, string>;
  configurableProps?: PropDefinition[];
  configurableStyles?: StyleDefinition[];
  sizeConstraints?: SizeConstraints;
  staticExportTemplate?: string;
  thymeleafExportTemplate?: string;
  hasCustomExport?: boolean;
}

export interface PropDefinition {
  name: string;
  type: string;
  label: string;
  defaultValue?: any;
  options?: Array<{ label: string; value: any }>;
  required?: boolean;
}

export interface StyleDefinition {
  property: string;
  label: string;
  type: string;
  defaultValue?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface SizeConstraints {
  defaultWidth?: string;
  defaultHeight?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  resizable?: boolean;
}

/**
 * Page usage info
 */
export interface PageUsageInfo {
  pageId: number;
  pageName: string;
  pageSlug: string;
  siteId: number;
  siteName: string;
}

/**
 * Deactivated component info
 */
export interface DeactivatedComponentInfo {
  pluginId: string;
  componentId: string;
  componentName: string;
  instanceId?: string;
}

/**
 * Component validation result
 */
export interface ComponentValidationResult {
  valid: boolean;
  deactivatedComponents: DeactivatedComponentInfo[];
  deactivatedCount: number;
}

/**
 * Component Admin Service
 * Provides admin-only operations for managing the component registry.
 */
class ComponentAdminService {
  private readonly basePath = '/admin/components';

  /**
   * Get all components including inactive ones (admin only)
   */
  async getAllComponents(): Promise<ComponentRegistryEntry[]> {
    const response = await api.get<ComponentRegistryEntry[]>(this.basePath);
    return response.data;
  }

  /**
   * Register a component from manifest JSON
   */
  async registerComponent(manifest: ComponentManifest): Promise<ComponentRegistryEntry> {
    const response = await api.post<ComponentRegistryEntry>(
      `${this.basePath}/register`,
      manifest
    );
    return response.data;
  }

  /**
   * Upload a plugin JAR file
   */
  async uploadPlugin(file: File): Promise<{ message: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<{ message: string; filename: string }>(
      `${this.basePath}/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }

  /**
   * Activate a component
   */
  async activateComponent(
    pluginId: string,
    componentId: string
  ): Promise<{ message: string; component: ComponentRegistryEntry }> {
    const response = await api.patch<{ message: string; component: ComponentRegistryEntry }>(
      `${this.basePath}/${pluginId}/${componentId}/activate`
    );
    return response.data;
  }

  /**
   * Deactivate a component
   * Returns list of affected pages that use this component
   */
  async deactivateComponent(
    pluginId: string,
    componentId: string
  ): Promise<{ message: string; affectedPages: PageUsageInfo[]; affectedPagesCount: number }> {
    const response = await api.patch<{
      message: string;
      affectedPages: PageUsageInfo[];
      affectedPagesCount: number;
    }>(`${this.basePath}/${pluginId}/${componentId}/deactivate`);
    return response.data;
  }

  /**
   * Delete a component permanently
   * Will fail if component is used by any pages
   */
  async deleteComponent(pluginId: string, componentId: string): Promise<void> {
    await api.delete(`${this.basePath}/${pluginId}/${componentId}`);
  }

  /**
   * Get pages using a specific component
   */
  async getComponentUsage(
    pluginId: string,
    componentId: string
  ): Promise<{ pluginId: string; componentId: string; pages: PageUsageInfo[]; usageCount: number }> {
    const response = await api.get<{
      pluginId: string;
      componentId: string;
      pages: PageUsageInfo[];
      usageCount: number;
    }>(`${this.basePath}/${pluginId}/${componentId}/usage`);
    return response.data;
  }

  /**
   * Validate page components - check if any components are deactivated
   */
  async validatePageComponents(
    siteId: number,
    pageId: number
  ): Promise<ComponentValidationResult> {
    const response = await api.post<ComponentValidationResult>(
      `/sites/${siteId}/pages/${pageId}/validate-components`
    );
    return response.data;
  }

  /**
   * Parse the component manifest JSON from a registry entry
   */
  parseManifest(entry: ComponentRegistryEntry): ComponentManifest | null {
    try {
      return JSON.parse(entry.componentManifest);
    } catch {
      console.warn('Failed to parse component manifest for', entry.componentId);
      return null;
    }
  }
}

// Export singleton instance
export const componentAdminService = new ComponentAdminService();

// Also export class for testing
export { ComponentAdminService };
