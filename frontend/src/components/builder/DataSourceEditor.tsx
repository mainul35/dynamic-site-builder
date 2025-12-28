import React, { useState, useEffect } from 'react';
import { DataSourceConfig, DataSourceType, FieldMappingConfig } from '../../types/builder';
import './DataSourceEditor.css';

interface DataSourceEditorProps {
  dataSource?: DataSourceConfig;
  onChange: (dataSource: DataSourceConfig | undefined) => void;
  onTest?: (dataSource: DataSourceConfig) => Promise<any>;
}

/**
 * DataSourceEditor - UI for configuring data sources for components
 * Supports API, Static, and Context data source types
 */
const DataSourceEditor: React.FC<DataSourceEditorProps> = ({
  dataSource,
  onChange,
  onTest,
}) => {
  const [localConfig, setLocalConfig] = useState<DataSourceConfig | undefined>(dataSource);
  const [testResult, setTestResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showFieldMapping, setShowFieldMapping] = useState(false);

  useEffect(() => {
    setLocalConfig(dataSource);
  }, [dataSource]);

  const handleTypeChange = (type: DataSourceType) => {
    const newConfig: DataSourceConfig = {
      type,
      endpoint: type === 'api' ? '' : undefined,
      method: type === 'api' ? 'GET' : undefined,
      staticData: type === 'static' ? [] : undefined,
      contextKey: type === 'context' ? '' : undefined,
    };
    setLocalConfig(newConfig);
    onChange(newConfig);
    setTestResult(null);
  };

  const handleConfigChange = (field: keyof DataSourceConfig, value: any) => {
    if (!localConfig) return;

    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
    onChange(newConfig);
    setTestResult(null);
  };

  const handleFieldMappingChange = (fieldName: string, mappingConfig: FieldMappingConfig | null) => {
    if (!localConfig) return;

    const currentMapping = localConfig.fieldMapping || {};
    let newMapping: Record<string, string | FieldMappingConfig>;

    if (mappingConfig === null) {
      // Remove the field mapping
      const { [fieldName]: removed, ...rest } = currentMapping;
      newMapping = rest;
    } else {
      newMapping = { ...currentMapping, [fieldName]: mappingConfig };
    }

    handleConfigChange('fieldMapping', Object.keys(newMapping).length > 0 ? newMapping : undefined);
  };

  const addFieldMapping = () => {
    const fieldName = prompt('Enter the target field name (e.g., "title", "items"):');
    if (fieldName && fieldName.trim()) {
      handleFieldMappingChange(fieldName.trim(), { path: '' });
    }
  };

  const handleTest = async () => {
    if (!localConfig || !onTest) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await onTest(localConfig);
      setTestResult({ success: true, data: result });
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRemove = () => {
    setLocalConfig(undefined);
    onChange(undefined);
    setTestResult(null);
  };

  const renderAPIConfig = () => (
    <div className="datasource-config-section">
      <div className="config-field">
        <label>Endpoint URL</label>
        <input
          type="text"
          value={localConfig?.endpoint || ''}
          onChange={(e) => handleConfigChange('endpoint', e.target.value)}
          placeholder="/api/products or https://api.example.com/data"
        />
      </div>

      <div className="config-field">
        <label>HTTP Method</label>
        <select
          value={localConfig?.method || 'GET'}
          onChange={(e) => handleConfigChange('method', e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
        </select>
      </div>

      <div className="config-field">
        <label>Headers (JSON)</label>
        <textarea
          value={localConfig?.headers ? JSON.stringify(localConfig.headers, null, 2) : ''}
          onChange={(e) => {
            try {
              const headers = e.target.value ? JSON.parse(e.target.value) : undefined;
              handleConfigChange('headers', headers);
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder='{"Authorization": "Bearer token"}'
          rows={3}
        />
      </div>

      <div className="config-field">
        <label>Cache Key (optional)</label>
        <input
          type="text"
          value={localConfig?.cacheKey || ''}
          onChange={(e) => handleConfigChange('cacheKey', e.target.value || undefined)}
          placeholder="products-cache"
        />
      </div>

      <div className="config-field">
        <label>Cache TTL (ms)</label>
        <input
          type="number"
          value={localConfig?.cacheTtlMs || ''}
          onChange={(e) => handleConfigChange('cacheTtlMs', e.target.value ? parseInt(e.target.value) : undefined)}
          placeholder="60000"
        />
      </div>
    </div>
  );

  const renderStaticConfig = () => (
    <div className="datasource-config-section">
      <div className="config-field">
        <label>Static Data (JSON)</label>
        <textarea
          value={localConfig?.staticData ? JSON.stringify(localConfig.staticData, null, 2) : ''}
          onChange={(e) => {
            try {
              const data = e.target.value ? JSON.parse(e.target.value) : undefined;
              handleConfigChange('staticData', data);
            } catch {
              // Invalid JSON, ignore
            }
          }}
          placeholder='[{"id": 1, "name": "Item 1"}, {"id": 2, "name": "Item 2"}]'
          rows={8}
        />
      </div>
    </div>
  );

  const renderContextConfig = () => (
    <div className="datasource-config-section">
      <div className="config-field">
        <label>Context Key</label>
        <input
          type="text"
          value={localConfig?.contextKey || ''}
          onChange={(e) => handleConfigChange('contextKey', e.target.value)}
          placeholder="user, session, etc."
        />
        <small>This will be populated from request context at runtime.</small>
      </div>
    </div>
  );

  const renderFieldMapping = () => {
    const mapping = localConfig?.fieldMapping || {};
    const entries = Object.entries(mapping);

    return (
      <div className="datasource-field-mapping">
        <div className="field-mapping-header">
          <h4>Field Mapping</h4>
          <button type="button" onClick={addFieldMapping} className="btn-add-mapping">
            + Add Mapping
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="no-mappings">No field mappings configured. Click "Add Mapping" to transform API response fields.</p>
        ) : (
          <div className="mapping-list">
            {entries.map(([fieldName, config]) => {
              const mappingConfig = typeof config === 'string'
                ? { path: config }
                : config as FieldMappingConfig;

              return (
                <div key={fieldName} className="mapping-item">
                  <div className="mapping-field-name">
                    <label>Target Field</label>
                    <input type="text" value={fieldName} disabled />
                  </div>

                  <div className="mapping-path">
                    <label>Source Path</label>
                    <input
                      type="text"
                      value={mappingConfig.path || ''}
                      onChange={(e) =>
                        handleFieldMappingChange(fieldName, { ...mappingConfig, path: e.target.value })
                      }
                      placeholder="data.items or response.user.name"
                    />
                  </div>

                  <div className="mapping-transform">
                    <label>Transform</label>
                    <select
                      value={mappingConfig.transform || ''}
                      onChange={(e) =>
                        handleFieldMappingChange(fieldName, {
                          ...mappingConfig,
                          transform: e.target.value || undefined,
                        })
                      }
                    >
                      <option value="">None</option>
                      <option value="uppercase">Uppercase</option>
                      <option value="lowercase">Lowercase</option>
                      <option value="trim">Trim</option>
                      <option value="number">To Number</option>
                      <option value="integer">To Integer</option>
                      <option value="boolean">To Boolean</option>
                      <option value="string">To String</option>
                    </select>
                  </div>

                  <div className="mapping-fallback">
                    <label>Fallback</label>
                    <input
                      type="text"
                      value={mappingConfig.fallback !== undefined ? String(mappingConfig.fallback) : ''}
                      onChange={(e) =>
                        handleFieldMappingChange(fieldName, {
                          ...mappingConfig,
                          fallback: e.target.value || undefined,
                        })
                      }
                      placeholder="Default value"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleFieldMappingChange(fieldName, null)}
                    className="btn-remove-mapping"
                    title="Remove mapping"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTestResult = () => {
    if (!testResult) return null;

    return (
      <div className={`test-result ${testResult.success ? 'success' : 'error'}`}>
        <div className="test-result-header">
          {testResult.success ? '✓ Test Successful' : '✗ Test Failed'}
        </div>
        {testResult.success && testResult.data && (
          <pre className="test-result-data">
            {JSON.stringify(testResult.data, null, 2).slice(0, 500)}
            {JSON.stringify(testResult.data).length > 500 && '...'}
          </pre>
        )}
        {testResult.error && (
          <div className="test-result-error">{testResult.error}</div>
        )}
      </div>
    );
  };

  if (!localConfig) {
    return (
      <div className="datasource-editor empty">
        <p>No data source configured.</p>
        <div className="datasource-type-buttons">
          <button type="button" onClick={() => handleTypeChange('api')}>
            Add API Source
          </button>
          <button type="button" onClick={() => handleTypeChange('static')}>
            Add Static Data
          </button>
          <button type="button" onClick={() => handleTypeChange('context')}>
            Add Context Source
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="datasource-editor">
      <div className="datasource-header">
        <div className="datasource-type-selector">
          <label>Data Source Type</label>
          <select
            value={localConfig.type}
            onChange={(e) => handleTypeChange(e.target.value as DataSourceType)}
          >
            <option value="api">API</option>
            <option value="static">Static</option>
            <option value="context">Context</option>
          </select>
        </div>
        <button type="button" onClick={handleRemove} className="btn-remove">
          Remove Data Source
        </button>
      </div>

      {localConfig.type === 'api' && renderAPIConfig()}
      {localConfig.type === 'static' && renderStaticConfig()}
      {localConfig.type === 'context' && renderContextConfig()}

      {localConfig.type === 'api' && (
        <>
          <div className="field-mapping-toggle">
            <button
              type="button"
              onClick={() => setShowFieldMapping(!showFieldMapping)}
              className="btn-toggle"
            >
              {showFieldMapping ? '▼' : '▶'} Field Mapping
            </button>
          </div>
          {showFieldMapping && renderFieldMapping()}
        </>
      )}

      <div className="datasource-actions">
        {onTest && localConfig.type !== 'context' && (
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="btn-test"
          >
            {isTesting ? 'Testing...' : 'Test Data Source'}
          </button>
        )}
      </div>

      {renderTestResult()}
    </div>
  );
};

export default DataSourceEditor;
export { DataSourceEditor };
