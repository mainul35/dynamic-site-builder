import React, { useState } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import {
  exportSinglePage,
  exportDemoSite,
  downloadHTML,
  downloadBlob,
} from '../../services/staticExportService';
import { Page } from '../../types/site';
import './ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: number | null;
  currentPageMeta?: Page | null;
  onSaveBeforeExport?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
}

type ExportType = 'current-page' | 'all-pages';
type ExportFormat = 'html' | 'zip';

/**
 * ExportModal - Modal for exporting site as deployable files
 */
export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  siteId,
  currentPageMeta,
  onSaveBeforeExport,
  hasUnsavedChanges = false,
}) => {
  const { currentPage } = useBuilderStore();
  const [exportType, setExportType] = useState<ExportType>('all-pages');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('zip');
  const [siteName, setSiteName] = useState('My Site');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(false);

    try {
      // IMPORTANT: Save the current page before exporting to ensure
      // localStorage has the latest content for all pages
      if (hasUnsavedChanges && onSaveBeforeExport) {
        console.log('[ExportModal] Saving current page before export...');
        await onSaveBeforeExport();
        // Small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      if (exportType === 'current-page') {
        // Export single page
        if (!currentPage) {
          throw new Error('No page to export. Please create a page first.');
        }

        // exportSinglePage is now async to handle image embedding
        const html = await exportSinglePage(currentPage, {
          includeCss: false,
          includeJs: false,
        });

        // Use currentPageMeta.pageSlug if available for consistent naming
        const pageName = currentPageMeta?.pageSlug || currentPage.pageName.replace(/\s+/g, '-').toLowerCase();
        const filename = `${pageName}.html`;
        downloadHTML(html, filename);
      } else {
        // Export all pages as ZIP
        const blob = await exportDemoSite(siteName);
        const filename = `${siteName.replace(/\s+/g, '-').toLowerCase()}-site.zip`;
        downloadBlob(blob, filename);
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-modal-header">
          <h2>Export Site</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="export-modal-body">
          {/* Site Name Input */}
          <div className="export-field">
            <label htmlFor="siteName">Site Name</label>
            <input
              id="siteName"
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Enter site name"
            />
          </div>

          {/* Export Type Selection */}
          <div className="export-field">
            <label>What to Export</label>
            <div className="export-options">
              <label className="export-option">
                <input
                  type="radio"
                  name="exportType"
                  value="all-pages"
                  checked={exportType === 'all-pages'}
                  onChange={() => setExportType('all-pages')}
                />
                <div className="option-content">
                  <span className="option-icon">📦</span>
                  <div className="option-text">
                    <strong>Entire Site</strong>
                    <span>Export all pages as a deployable ZIP</span>
                  </div>
                </div>
              </label>

              <label className="export-option">
                <input
                  type="radio"
                  name="exportType"
                  value="current-page"
                  checked={exportType === 'current-page'}
                  onChange={() => setExportType('current-page')}
                />
                <div className="option-content">
                  <span className="option-icon">📄</span>
                  <div className="option-text">
                    <strong>Current Page Only</strong>
                    <span>Export as single HTML file</span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Info */}
          <div className="export-info">
            <h4>Export includes:</h4>
            {exportType === 'all-pages' ? (
              <ul>
                <li>HTML files for each page</li>
                <li>CSS stylesheet (styles.css)</li>
                <li>JavaScript file (main.js)</li>
                <li>README with deployment instructions</li>
              </ul>
            ) : (
              <ul>
                <li>Single HTML file with embedded CSS/JS</li>
                <li>All component styles inline</li>
                <li>Ready to view in any browser</li>
              </ul>
            )}
          </div>

          {/* Deployment Tips */}
          <div className="deployment-tips">
            <h4>Quick Deploy Options:</h4>
            <div className="deploy-options">
              <a
                href="https://app.netlify.com/drop"
                target="_blank"
                rel="noopener noreferrer"
                className="deploy-option"
              >
                <span className="deploy-icon">▲</span>
                Netlify Drop
              </a>
              <a
                href="https://pages.github.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="deploy-option"
              >
                <span className="deploy-icon">🐙</span>
                GitHub Pages
              </a>
              <a
                href="https://vercel.com/new"
                target="_blank"
                rel="noopener noreferrer"
                className="deploy-option"
              >
                <span className="deploy-icon">◆</span>
                Vercel
              </a>
            </div>
          </div>

          {/* Unsaved Changes Warning */}
          {hasUnsavedChanges && (
            <div className="export-warning">
              <span className="warning-icon">⚠️</span>
              You have unsaved changes. They will be saved automatically before export.
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="export-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="export-success">
              <span className="success-icon">✓</span>
              Export successful! Download started.
            </div>
          )}
        </div>

        <div className="export-modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={isExporting}>
            Cancel
          </button>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={isExporting || !siteName.trim()}
          >
            {isExporting ? (
              <>
                <span className="spinner"></span>
                Exporting...
              </>
            ) : (
              <>
                <span className="download-icon">⬇</span>
                {exportType === 'all-pages' ? 'Download ZIP' : 'Download HTML'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
