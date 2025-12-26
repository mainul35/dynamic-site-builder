import api from './api';

/**
 * Content item returned from the repository
 */
export interface ContentItem {
  id: string;
  name: string;
  originalName: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string;
  folder: string;
  uploadedAt: string;
  width?: number;
  height?: number;
}

/**
 * Repository statistics
 */
export interface ContentStats {
  totalFiles: number;
  totalSize: number;
  images: number;
  videos: number;
  documents: number;
  other: number;
}

/**
 * Content Repository Service
 * Handles file uploads, retrieval, and management
 */
export const contentService = {
  /**
   * Upload a file to the content repository
   */
  async uploadFile(file: File, folder?: string): Promise<ContentItem> {
    const formData = new FormData();
    formData.append('file', file);
    if (folder) {
      formData.append('folder', folder);
    }

    const response = await api.post<ContentItem>('/content/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get all images in the repository
   */
  async getImages(folder?: string): Promise<ContentItem[]> {
    const params = folder ? { folder } : {};
    const response = await api.get<ContentItem[]>('/content/images', { params });
    return response.data;
  },

  /**
   * Get all content items with optional filters
   */
  async getContent(type?: string, folder?: string): Promise<ContentItem[]> {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    if (folder) params.folder = folder;

    const response = await api.get<ContentItem[]>('/content', { params });
    return response.data;
  },

  /**
   * Get a specific content item by ID
   */
  async getContentItem(id: string): Promise<ContentItem> {
    const response = await api.get<ContentItem>(`/content/${id}`);
    return response.data;
  },

  /**
   * Delete a content item
   */
  async deleteContent(id: string): Promise<void> {
    await api.delete(`/content/${id}`);
  },

  /**
   * Get repository statistics
   */
  async getStats(): Promise<ContentStats> {
    const response = await api.get<ContentStats>('/content/stats');
    return response.data;
  },

  /**
   * Get all folders
   */
  async getFolders(): Promise<string[]> {
    const response = await api.get<string[]>('/content/folders');
    return response.data;
  },

  /**
   * Create a new folder
   */
  async createFolder(folderPath: string): Promise<void> {
    await api.post('/content/folders', null, {
      params: { path: folderPath },
    });
  },

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
};
