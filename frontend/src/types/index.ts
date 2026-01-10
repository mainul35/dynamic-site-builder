// Media-related types
export interface Media {
  id?: number;
  fileName: string;
  originalFileName?: string;
  mediaType: string;
  fileExtension?: string;
  mimeType?: string;
  filePath: string;
  fileSize?: number;
  externalUrl?: string;
  uploadedAt?: string;
}

// Re-export builder and site types
export * from './builder';
export * from './site';
