import React, { useState } from 'react';
import { useBuilderStore } from '../../stores/builderStore';
import {
  exportSinglePage,
  exportDemoSite,
  downloadHTML,
  downloadBlob,
} from '../../services/staticExportService';
import {
  exportAsThymeleafProject,
  downloadThymeleafProject,
} from '../../services/thymeleafExportService';
import { Page } from '../../types/site';
import { PageDefinition } from '../../types/builder';
import './ExportModal.css';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId?: number | null;
  currentPageMeta?: Page | null;
  onSaveBeforeExport?: () => Promise<void>;
  hasUnsavedChanges?: boolean;
}

type ExportType = 'current-page' | 'all-pages' | 'spring-boot';
type ExportFormat = 'html' | 'zip';

interface SpringBootOptions {
  projectName: string;
  groupId: string;
  artifactId: string;
  version: string;
  springBootVersion: string;
  javaVersion: string;
}

/**
 * ExportModal - Modal for exporting site as deployable files
 * Supports static HTML export and Spring Boot/Thymeleaf project export
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

  // Spring Boot options
  const [springBootOptions, setSpringBootOptions] = useState<SpringBootOptions>({
    projectName: 'my-site',
    groupId: 'com.example',
    artifactId: 'my-site',
    version: '1.0.0',
    springBootVersion: '3.2.0',
    javaVersion: '21',
  });

  if (!isOpen) return null;

  const handleSpringBootOptionChange = (field: keyof SpringBootOptions, value: string) => {
    setSpringBootOptions(prev => ({ ...prev, [field]: value }));
  };

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
        // Export single page as HTML
        if (!currentPage) {
          throw new Error('No page to export. Please create a page first.');
        }

        const html = await exportSinglePage(currentPage, {
          includeCss: false,
          includeJs: false,
        });

        const pageName = currentPageMeta?.pageSlug || currentPage.pageName.replace(/\s+/g, '-').toLowerCase();
        const filename = `${pageName}.html`;
        downloadHTML(html, filename);
      } else if (exportType === 'spring-boot') {
        // Export as Spring Boot/Thymeleaf project
        const savedPages = JSON.parse(localStorage.getItem('builder_saved_pages') || '{}');

        if (Object.keys(savedPages).length === 0) {
          throw new Error('No pages to export. Please create and save at least one page.');
        }

        const pages = Object.entries(savedPages).map(([slug, definition]: [string, any]) => ({
          pageName: definition.pageName || slug,
          path: slug === 'home' ? '/' : `/${slug}`,
          definition: definition as PageDefinition,
        }));

        const blob = await exportAsThymeleafProject(pages, springBootOptions);
        const filename = `${springBootOptions.artifactId}-spring-boot.zip`;
        downloadThymeleafProject(blob, filename);
      } else {
        // Export all pages as static ZIP
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
      <div className="export-modal export-modal-large" onClick={(e) => e.stopPropagation()}>
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
            <label>Export Type</label>
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
                    <strong>Static HTML Site</strong>
                    <span>Export as static HTML/CSS/JS files</span>
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

              <label className="export-option export-option-featured">
                <input
                  type="radio"
                  name="exportType"
                  value="spring-boot"
                  checked={exportType === 'spring-boot'}
                  onChange={() => setExportType('spring-boot')}
                />
                <div className="option-content">
                  <span className="option-icon">🚀</span>
                  <div className="option-text">
                    <strong>Spring Boot Application</strong>
                    <span>Export as runnable Java application with Thymeleaf</span>
                  </div>
                  <span className="option-badge">Recommended</span>
                </div>
              </label>
            </div>
          </div>

          {/* Spring Boot Options */}
          {exportType === 'spring-boot' && (
            <div className="spring-boot-options">
              <h4>Project Configuration</h4>
              <div className="options-grid">
                <div className="export-field">
                  <label htmlFor="projectName">Project Name</label>
                  <input
                    id="projectName"
                    type="text"
                    value={springBootOptions.projectName}
                    onChange={(e) => handleSpringBootOptionChange('projectName', e.target.value)}
                    placeholder="my-site"
                  />
                </div>

                <div className="export-field">
                  <label htmlFor="groupId">Group ID</label>
                  <input
                    id="groupId"
                    type="text"
                    value={springBootOptions.groupId}
                    onChange={(e) => handleSpringBootOptionChange('groupId', e.target.value)}
                    placeholder="com.example"
                  />
                </div>

                <div className="export-field">
                  <label htmlFor="artifactId">Artifact ID</label>
                  <input
                    id="artifactId"
                    type="text"
                    value={springBootOptions.artifactId}
                    onChange={(e) => handleSpringBootOptionChange('artifactId', e.target.value)}
                    placeholder="my-site"
                  />
                </div>

                <div className="export-field">
                  <label htmlFor="version">Version</label>
                  <input
                    id="version"
                    type="text"
                    value={springBootOptions.version}
                    onChange={(e) => handleSpringBootOptionChange('version', e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>

                <div className="export-field">
                  <label htmlFor="springBootVersion">Spring Boot Version</label>
                  <select
                    id="springBootVersion"
                    value={springBootOptions.springBootVersion}
                    onChange={(e) => handleSpringBootOptionChange('springBootVersion', e.target.value)}
                  >
                    <option value="3.2.0">3.2.0</option>
                    <option value="3.1.0">3.1.0</option>
                    <option value="3.0.0">3.0.0</option>
                  </select>
                </div>

                <div className="export-field">
                  <label htmlFor="javaVersion">Java Version</label>
                  <select
                    id="javaVersion"
                    value={springBootOptions.javaVersion}
                    onChange={(e) => handleSpringBootOptionChange('javaVersion', e.target.value)}
                  >
                    <option value="21">Java 21</option>
                    <option value="17">Java 17</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Export Info */}
          <div className="export-info">
            <h4>Export includes:</h4>
            {exportType === 'spring-boot' ? (
              <ul>
                <li>Complete Maven project structure</li>
                <li>Spring Boot application with Thymeleaf templates</li>
                <li>Page controller with data binding support</li>
                <li>Configurable data sources (API, Database)</li>
                <li>Authentication support (OAuth2, SSO)</li>
                <li>Dockerfile for containerization</li>
                <li>README with deployment instructions</li>
              </ul>
            ) : exportType === 'all-pages' ? (
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
            <h4>Deployment Options:</h4>
            {exportType === 'spring-boot' ? (
              <div className="deploy-options">
                <div className="deploy-option deploy-option-info">
                  <span className="deploy-icon">💻</span>
                  <div>
                    <strong>Local Run</strong>
                    <span>mvn spring-boot:run</span>
                  </div>
                </div>
                <div className="deploy-option deploy-option-info">
                  <span className="deploy-icon">🐳</span>
                  <div>
                    <strong>Docker</strong>
                    <span>docker build & run</span>
                  </div>
                </div>
                <a
                  href="https://render.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="deploy-option"
                >
                  <span className="deploy-icon">🌐</span>
                  Render
                </a>
                <a
                  href="https://railway.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="deploy-option"
                >
                  <span className="deploy-icon">🚂</span>
                  Railway
                </a>
              </div>
            ) : (
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
            )}
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
                {exportType === 'spring-boot'
                  ? 'Download Spring Boot Project'
                  : exportType === 'all-pages'
                    ? 'Download ZIP'
                    : 'Download HTML'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
