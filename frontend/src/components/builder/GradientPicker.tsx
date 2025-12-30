import React, { useState, useEffect } from 'react';
import './GradientPicker.css';

export interface GradientStop {
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  type: 'solid' | 'linear' | 'radial';
  angle?: number; // For linear gradients (0-360)
  stops: GradientStop[];
}

interface GradientPickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  defaultColor?: string;
}

// Parse a CSS gradient or color value into GradientConfig
const parseGradientValue = (value: string, defaultColor: string): GradientConfig => {
  if (!value || value === 'transparent') {
    return {
      type: 'solid',
      stops: [{ color: defaultColor, position: 0 }]
    };
  }

  // Check for linear gradient
  const linearMatch = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (linearMatch) {
    const angle = parseInt(linearMatch[1], 10);
    const stopsStr = linearMatch[2];
    const stops = parseGradientStops(stopsStr);
    return { type: 'linear', angle, stops };
  }

  // Check for radial gradient
  const radialMatch = value.match(/radial-gradient\(circle,\s*(.+)\)/);
  if (radialMatch) {
    const stops = parseGradientStops(radialMatch[1]);
    return { type: 'radial', stops };
  }

  // Solid color
  return {
    type: 'solid',
    stops: [{ color: value, position: 0 }]
  };
};

// Parse gradient stops from CSS string
const parseGradientStops = (stopsStr: string): GradientStop[] => {
  const stops: GradientStop[] = [];
  // Match color with optional percentage
  const stopRegex = /(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|[a-z]+)\s*(\d+%)?/g;
  let match;
  let index = 0;

  while ((match = stopRegex.exec(stopsStr)) !== null) {
    const color = match[1];
    const position = match[2] ? parseInt(match[2], 10) : (index === 0 ? 0 : 100);
    stops.push({ color, position });
    index++;
  }

  if (stops.length === 0) {
    return [
      { color: '#ffffff', position: 0 },
      { color: '#000000', position: 100 }
    ];
  }

  return stops;
};

// Convert GradientConfig to CSS string
const gradientConfigToCSS = (config: GradientConfig): string => {
  if (config.type === 'solid') {
    return config.stops[0]?.color || '#ffffff';
  }

  const stopsStr = config.stops
    .sort((a, b) => a.position - b.position)
    .map(stop => `${stop.color} ${stop.position}%`)
    .join(', ');

  if (config.type === 'linear') {
    return `linear-gradient(${config.angle || 90}deg, ${stopsStr})`;
  }

  if (config.type === 'radial') {
    return `radial-gradient(circle, ${stopsStr})`;
  }

  return config.stops[0]?.color || '#ffffff';
};

// Preset gradients
const GRADIENT_PRESETS = [
  { name: 'Sunset', value: 'linear-gradient(90deg, #ff7e5f 0%, #feb47b 100%)' },
  { name: 'Ocean', value: 'linear-gradient(90deg, #2193b0 0%, #6dd5ed 100%)' },
  { name: 'Purple', value: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)' },
  { name: 'Fire', value: 'linear-gradient(90deg, #f12711 0%, #f5af19 100%)' },
  { name: 'Forest', value: 'linear-gradient(90deg, #134e5e 0%, #71b280 100%)' },
  { name: 'Night', value: 'linear-gradient(90deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
  { name: 'Rose', value: 'linear-gradient(90deg, #ee9ca7 0%, #ffdde1 100%)' },
  { name: 'Sky', value: 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)' },
];

export const GradientPicker: React.FC<GradientPickerProps> = ({
  value,
  onChange,
  label,
  defaultColor = '#ffffff'
}) => {
  const [config, setConfig] = useState<GradientConfig>(() =>
    parseGradientValue(value, defaultColor)
  );
  const [showPresets, setShowPresets] = useState(false);

  // Update config when external value changes
  useEffect(() => {
    const parsed = parseGradientValue(value, defaultColor);
    setConfig(parsed);
  }, [value, defaultColor]);

  // Emit CSS value when config changes
  const emitChange = (newConfig: GradientConfig) => {
    setConfig(newConfig);
    onChange(gradientConfigToCSS(newConfig));
  };

  const handleTypeChange = (type: 'solid' | 'linear' | 'radial') => {
    const newConfig: GradientConfig = { ...config, type };

    if (type === 'solid') {
      newConfig.stops = [{ color: config.stops[0]?.color || defaultColor, position: 0 }];
    } else if (config.stops.length < 2) {
      // Add a second stop for gradients
      newConfig.stops = [
        { color: config.stops[0]?.color || '#ffffff', position: 0 },
        { color: '#000000', position: 100 }
      ];
    }

    if (type === 'linear' && !newConfig.angle) {
      newConfig.angle = 90;
    }

    emitChange(newConfig);
  };

  const handleAngleChange = (angle: number) => {
    emitChange({ ...config, angle });
  };

  const handleStopColorChange = (index: number, color: string) => {
    const newStops = [...config.stops];
    newStops[index] = { ...newStops[index], color };
    emitChange({ ...config, stops: newStops });
  };

  const handleStopPositionChange = (index: number, position: number) => {
    const newStops = [...config.stops];
    newStops[index] = { ...newStops[index], position: Math.max(0, Math.min(100, position)) };
    emitChange({ ...config, stops: newStops });
  };

  const addStop = () => {
    if (config.stops.length >= 5) return; // Limit to 5 stops
    const newPosition = 50;
    const newStops = [...config.stops, { color: '#888888', position: newPosition }];
    emitChange({ ...config, stops: newStops });
  };

  const removeStop = (index: number) => {
    if (config.stops.length <= 2) return; // Keep at least 2 stops for gradients
    const newStops = config.stops.filter((_, i) => i !== index);
    emitChange({ ...config, stops: newStops });
  };

  const applyPreset = (presetValue: string) => {
    onChange(presetValue);
    setShowPresets(false);
  };

  const previewStyle: React.CSSProperties = {
    background: gradientConfigToCSS(config),
  };

  return (
    <div className="gradient-picker">
      {label && <label className="gradient-picker-label">{label}</label>}

      {/* Preview */}
      <div className="gradient-preview" style={previewStyle} />

      {/* Type Selector */}
      <div className="gradient-type-selector">
        <button
          type="button"
          className={`type-btn ${config.type === 'solid' ? 'active' : ''}`}
          onClick={() => handleTypeChange('solid')}
        >
          Solid
        </button>
        <button
          type="button"
          className={`type-btn ${config.type === 'linear' ? 'active' : ''}`}
          onClick={() => handleTypeChange('linear')}
        >
          Linear
        </button>
        <button
          type="button"
          className={`type-btn ${config.type === 'radial' ? 'active' : ''}`}
          onClick={() => handleTypeChange('radial')}
        >
          Radial
        </button>
      </div>

      {/* Angle Control (for linear gradients) */}
      {config.type === 'linear' && (
        <div className="gradient-angle-control">
          <label>Angle: {config.angle || 90}°</label>
          <input
            type="range"
            min="0"
            max="360"
            value={config.angle || 90}
            onChange={(e) => handleAngleChange(parseInt(e.target.value, 10))}
          />
        </div>
      )}

      {/* Color Stops */}
      <div className="gradient-stops">
        <div className="stops-header">
          <span>Color Stops</span>
          {config.type !== 'solid' && config.stops.length < 5 && (
            <button type="button" className="add-stop-btn" onClick={addStop}>
              + Add
            </button>
          )}
        </div>

        {config.stops.map((stop, index) => (
          <div key={index} className="gradient-stop">
            <input
              type="color"
              value={stop.color.startsWith('#') ? stop.color : '#000000'}
              onChange={(e) => handleStopColorChange(index, e.target.value)}
              className="stop-color"
            />
            <input
              type="text"
              value={stop.color}
              onChange={(e) => handleStopColorChange(index, e.target.value)}
              className="stop-color-text"
              placeholder="#000000"
            />
            {config.type !== 'solid' && (
              <>
                <input
                  type="number"
                  value={stop.position}
                  onChange={(e) => handleStopPositionChange(index, parseInt(e.target.value, 10))}
                  className="stop-position"
                  min="0"
                  max="100"
                />
                <span className="stop-position-label">%</span>
                {config.stops.length > 2 && (
                  <button
                    type="button"
                    className="remove-stop-btn"
                    onClick={() => removeStop(index)}
                    title="Remove stop"
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Presets */}
      {config.type !== 'solid' && (
        <div className="gradient-presets">
          <button
            type="button"
            className="presets-toggle"
            onClick={() => setShowPresets(!showPresets)}
          >
            {showPresets ? 'Hide Presets' : 'Show Presets'}
          </button>

          {showPresets && (
            <div className="presets-grid">
              {GRADIENT_PRESETS.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  className="preset-btn"
                  style={{ background: preset.value }}
                  onClick={() => applyPreset(preset.value)}
                  title={preset.name}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Raw CSS Input */}
      <div className="gradient-raw-input">
        <label>CSS Value</label>
        <input
          type="text"
          value={gradientConfigToCSS(config)}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter CSS gradient or color"
        />
      </div>
    </div>
  );
};

export default GradientPicker;
