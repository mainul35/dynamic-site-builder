import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  rows?: number;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  rows = 4,
}) => {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="markdown-editor">
      {label && <label className="markdown-label">{label}</label>}

      <div className="markdown-tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'write' ? 'active' : ''}`}
          onClick={() => setActiveTab('write')}
          disabled={disabled}
        >
          ✏️ Write
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
          disabled={disabled}
        >
          👁️ Preview
        </button>
      </div>

      <div className={`markdown-content ${error ? 'error' : ''}`}>
        {activeTab === 'write' ? (
          <textarea
            className="markdown-textarea"
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
          />
        ) : (
          <div className="markdown-preview">
            {value ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {value}
              </ReactMarkdown>
            ) : (
              <p className="preview-empty">Nothing to preview</p>
            )}
          </div>
        )}
      </div>

      {error && <div className="markdown-error">{error}</div>}

      <div className="markdown-help">
        <details>
          <summary>Markdown Help</summary>
          <div className="help-content">
            <p><strong>**bold**</strong> - Bold text</p>
            <p><em>*italic*</em> - Italic text</p>
            <p><code>`code`</code> - Inline code</p>
            <p># Heading - Heading levels (# to ######)</p>
            <p>- List item - Unordered list</p>
            <p>1. List item - Ordered list</p>
            <p>[Link](url) - Hyperlink</p>
            <p>```code block``` - Code block (use 3 backticks)</p>
          </div>
        </details>
      </div>
    </div>
  );
};

export default MarkdownEditor;
