import React, { useRef, useState, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { editor } from 'monaco-editor';
import './CSSEditor.css';

interface CSSEditorProps {
  value: string;
  onChange: (value: string) => void;
  componentId?: string;
  height?: string;
  theme?: 'light' | 'vs-dark';
  readOnly?: boolean;
  showMinimap?: boolean;
  onValidationError?: (errors: editor.IMarker[]) => void;
}

/**
 * CSSEditor - Monaco-based CSS editor with syntax highlighting and validation
 * Provides live CSS editing with autocomplete and error detection
 */
export const CSSEditor: React.FC<CSSEditorProps> = ({
  value,
  onChange,
  componentId,
  height = '400px',
  theme = 'light',
  readOnly = false,
  showMinimap = false,
  onValidationError
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<editor.IMarker[]>([]);

  useEffect(() => {
    // Set up validation listener
    if (monacoRef.current && editorRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const markers = monacoRef.current.editor.getModelMarkers({ resource: model.uri });
        const cssErrors = markers.filter(m => m.severity === monacoRef.current!.MarkerSeverity.Error);

        setIsValid(cssErrors.length === 0);
        setErrors(cssErrors);
        onValidationError?.(cssErrors);
      }
    }
  }, [value]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Configure CSS language features
    monaco.languages.css.cssDefaults.setOptions({
      validate: true,
      lint: {
        compatibleVendorPrefixes: 'warning',
        vendorPrefix: 'warning',
        duplicateProperties: 'warning',
        emptyRules: 'warning',
        importStatement: 'warning',
        boxModel: 'warning',
        universalSelector: 'warning',
        zeroUnits: 'warning',
        fontFaceProperties: 'warning',
        hexColorLength: 'warning',
        argumentsInColorFunction: 'warning',
        unknownProperties: 'warning',
        ieHack: 'warning',
        unknownVendorSpecificProperties: 'warning',
        propertyIgnoredDueToDisplay: 'warning',
        important: 'warning',
        float: 'warning',
        idSelector: 'warning'
      }
    });

    // Add custom CSS snippets and autocomplete
    monaco.languages.registerCompletionItemProvider('css', {
      provideCompletionItems: (model, position) => {
        const suggestions: any[] = [
          // Common CSS properties
          {
            label: 'display-flex',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: flex;\njustify-content: center;\nalign-items: center;',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Flexbox container'
          },
          {
            label: 'display-grid',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:20px};',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Grid container'
          },
          {
            label: 'center-absolute',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'position: absolute;\ntop: 50%;\nleft: 50%;\ntransform: translate(-50%, -50%);',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Center element with absolute positioning'
          }
        ];

        return { suggestions };
      }
    });

    // Listen for validation markers
    monaco.editor.onDidChangeMarkers(() => {
      const model = editor.getModel();
      if (model) {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri });
        const cssErrors = markers.filter(m => m.severity === monaco.MarkerSeverity.Error);

        setIsValid(cssErrors.length === 0);
        setErrors(cssErrors);
        onValidationError?.(cssErrors);
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    onChange(value || '');
  };

  const formatCSS = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const parseCSS = (): Record<string, string> => {
    const styles: Record<string, string> = {};

    try {
      // Simple CSS parser - extract property: value pairs
      const lines = value.split('\n');
      lines.forEach(line => {
        const match = line.match(/^\s*([\w-]+)\s*:\s*([^;]+);?\s*$/);
        if (match) {
          const [, property, value] = match;
          styles[property] = value.trim();
        }
      });
    } catch (error) {
      console.error('Failed to parse CSS:', error);
    }

    return styles;
  };

  return (
    <div className="css-editor-container">
      {/* Toolbar */}
      <div className="editor-toolbar">
        <div className="editor-info">
          {componentId && (
            <span className="component-label">Editing: {componentId}</span>
          )}
          <span className={`validation-status ${isValid ? 'valid' : 'invalid'}`}>
            {isValid ? '✓ Valid CSS' : `⚠ ${errors.length} Error(s)`}
          </span>
        </div>
        <div className="editor-actions">
          <button onClick={formatCSS} className="toolbar-button" title="Format CSS">
            Format
          </button>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper">
        <Editor
          height={height}
          language="css"
          theme={theme === 'light' ? 'light' : 'vs-dark'}
          value={value}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: showMinimap },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            formatOnPaste: true,
            formatOnType: true,
            quickSuggestions: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            snippetSuggestions: 'top',
            folding: true,
            foldingStrategy: 'indentation',
            showFoldingControls: 'always',
            bracketPairColorization: {
              enabled: true
            }
          }}
        />
      </div>

      {/* Error List */}
      {errors.length > 0 && (
        <div className="error-list">
          <div className="error-list-header">
            <span className="error-icon">⚠</span>
            <span>CSS Errors ({errors.length})</span>
          </div>
          {errors.map((error, index) => (
            <div key={index} className="error-item">
              <span className="error-location">
                Line {error.startLineNumber}, Col {error.startColumn}
              </span>
              <span className="error-message">{error.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* CSS Info */}
      <div className="editor-footer">
        <small className="editor-hint">
          💡 Tip: Use Ctrl+Space for autocomplete, Ctrl+S to apply changes
        </small>
      </div>
    </div>
  );
};
