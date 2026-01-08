import React, { useState, useRef, useCallback } from 'react';
import { ModalBase, ModalSection, ModalActions, ModalButton } from '../modals/ModalBase';
import { componentAdminService } from '../../services/componentAdminService';
import { reloadPlugin, isPluginLoaded } from '../../services/pluginLoaderService';
import './ComponentUploadModal.css';

export interface ComponentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

/**
 * ComponentUploadModal - Modal for uploading plugin JAR files
 * Supports drag-and-drop and file selection
 */
export const ComponentUploadModal: React.FC<ComponentUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setUploadState('idle');
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDragActive(false);
  }, []);

  const handleClose = () => {
    resetState();
    onClose();
  };

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.name.toLowerCase().endsWith('.jar')) {
      return 'Only JAR files are allowed';
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setSelectedFile(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setUploadState('idle');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set inactive if leaving the drop zone entirely
    if (e.currentTarget === e.target) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadState('uploading');
    setErrorMessage(null);

    try {
      const result = await componentAdminService.uploadPlugin(selectedFile);
      setUploadState('success');
      setSuccessMessage(`Plugin "${result.filename}" uploaded and activated successfully`);

      // Force reload the plugin to get the new version
      const pluginId = result.pluginId;
      if (pluginId) {
        if (isPluginLoaded(pluginId)) {
          console.log(`[ComponentUploadModal] Plugin ${pluginId} was updated, reloading frontend bundle...`);
          await reloadPlugin(pluginId);
          console.log(`[ComponentUploadModal] Plugin ${pluginId} reload complete`);
        } else {
          console.log(`[ComponentUploadModal] Plugin ${pluginId} not previously loaded, loading now...`);
          const { loadPlugin } = await import('../../services/pluginLoaderService');
          await loadPlugin(pluginId);
          console.log(`[ComponentUploadModal] Plugin ${pluginId} loaded`);
        }
      } else {
        console.warn(`[ComponentUploadModal] No pluginId returned from upload`);
      }

      // Notify parent of success after a brief delay
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1500);
    } catch (err: any) {
      setUploadState('error');
      const message = err.response?.data?.error || err.message || 'Failed to upload plugin';
      setErrorMessage(message);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const footer = (
    <ModalActions>
      <ModalButton variant="secondary" onClick={handleClose} disabled={uploadState === 'uploading'}>
        Cancel
      </ModalButton>
      <ModalButton
        variant="primary"
        onClick={handleUpload}
        disabled={!selectedFile || uploadState === 'uploading' || uploadState === 'success'}
        loading={uploadState === 'uploading'}
      >
        {uploadState === 'uploading' ? 'Uploading...' : 'Upload Plugin'}
      </ModalButton>
    </ModalActions>
  );

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Plugin JAR"
      size="medium"
      footer={footer}
    >
      <div className="cup-container">
        {/* Instructions */}
        <ModalSection>
          <p className="cup-description">
            Upload a plugin JAR file to register new components. The plugin will be automatically
            installed and activated.
          </p>
        </ModalSection>

        {/* Drop Zone */}
        <ModalSection title="Select File">
          <div
            className={`cup-dropzone ${isDragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''} ${uploadState === 'error' ? 'error' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jar"
              onChange={handleInputChange}
              className="cup-file-input"
            />

            {uploadState === 'uploading' ? (
              <div className="cup-uploading">
                <div className="cup-spinner" />
                <span>Uploading plugin...</span>
              </div>
            ) : selectedFile ? (
              <div className="cup-file-preview">
                <div className="cup-file-icon">JAR</div>
                <div className="cup-file-details">
                  <span className="cup-file-name">{selectedFile.name}</span>
                  <span className="cup-file-size">{formatFileSize(selectedFile.size)}</span>
                </div>
                <button
                  className="cup-file-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    setErrorMessage(null);
                  }}
                  title="Remove file"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="cup-dropzone-content">
                <div className="cup-dropzone-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M24 32V16M24 16l-8 8M24 16l8 8" />
                    <path d="M40 28v10a2 2 0 01-2 2H10a2 2 0 01-2-2V28" />
                  </svg>
                </div>
                <div className="cup-dropzone-text">
                  <span className="cup-dropzone-primary">
                    {isDragActive ? 'Drop the file here' : 'Drag and drop a JAR file here'}
                  </span>
                  <span className="cup-dropzone-secondary">
                    or <span className="cup-browse-link">browse</span> to select a file
                  </span>
                </div>
                <span className="cup-dropzone-hint">Accepts .jar files up to 50MB</span>
              </div>
            )}
          </div>
        </ModalSection>

        {/* Messages */}
        {errorMessage && (
          <div className="cup-message cup-error">
            <span className="cup-message-icon">!</span>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="cup-message cup-success">
            <span className="cup-message-icon">&#10003;</span>
            {successMessage}
          </div>
        )}

        {/* Info */}
        <ModalSection title="Requirements">
          <ul className="cup-requirements">
            <li>JAR file must contain a valid <code>plugin.yml</code> manifest</li>
            <li>Plugin must extend the component SDK interfaces</li>
            <li>Component IDs must be unique (not already registered)</li>
          </ul>
        </ModalSection>
      </div>
    </ModalBase>
  );
};

export default ComponentUploadModal;
