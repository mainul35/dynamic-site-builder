import React, { useEffect, useState } from 'react';
import { useComponentStore } from '../../stores/componentStore';
import { componentService } from '../../services/componentService';
import { ComponentRegistryEntry } from '../../types/builder';
import './ComponentPalette.css';

interface ComponentPaletteProps {
  onComponentDragStart?: (component: ComponentRegistryEntry) => void;
}

/**
 * Component Palette - Sidebar displaying available components
 * Users can search, filter by category, and drag components onto the canvas
 */
export const ComponentPalette: React.FC<ComponentPaletteProps> = ({ onComponentDragStart }) => {
  const {
    components,
    selectedCategory,
    searchQuery,
    isLoading,
    error,
    refreshTrigger,
    setComponents,
    setSelectedCategory,
    setSearchQuery,
    setLoading,
    setError,
    getFilteredComponents,
    getCategories
  } = useComponentStore();

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Load components on mount and when refreshTrigger changes (from admin panel actions)
  useEffect(() => {
    loadComponents();
  }, [refreshTrigger]);

  const loadComponents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await componentService.getAllComponents();
      setComponents(data);

      // Expand all categories by default
      const categories = new Set<string>();
      data.forEach(comp => {
        if (comp.category) {
          categories.add(comp.category);
        }
      });
      setExpandedCategories(categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load components');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
    }
  };

  const toggleCategoryExpansion = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDragStart = (e: React.DragEvent, component: ComponentRegistryEntry) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(component));
    onComponentDragStart?.(component);
  };

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  // Group filtered components by category
  const groupedComponents = () => {
    const filtered = getFilteredComponents();
    const groups = new Map<string, ComponentRegistryEntry[]>();

    filtered.forEach(comp => {
      const category = comp.category || 'Other';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(comp);
    });

    return groups;
  };

  const categories = getCategories();
  const grouped = groupedComponents();
  const hasActiveFilters = selectedCategory !== null || searchQuery.trim() !== '';

  return (
    <div className="component-palette">
      <div className="palette-header">
        <h3>Components</h3>
        <button onClick={loadComponents} className="refresh-button" title="Refresh components">
          ↻
        </button>
      </div>

      {/* Search Bar */}
      <div className="palette-search">
        <input
          type="text"
          placeholder="Search components..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
        />
        {hasActiveFilters && (
          <button onClick={clearFilters} className="clear-filters" title="Clear filters">
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Chips */}
      <div className="category-chips">
        <button
          className={`category-chip ${selectedCategory === null ? 'active' : ''}`}
          onClick={() => setSelectedCategory(null)}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category}
            className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => handleCategoryClick(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="palette-loading">
          <div className="spinner"></div>
          <p>Loading components...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="palette-error">
          <p>⚠️ {error}</p>
          <button onClick={loadComponents} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {/* Component List */}
      {!isLoading && !error && (
        <div className="component-list">
          {grouped.size === 0 ? (
            <div className="empty-state">
              <p>No components found</p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="clear-filters-button">
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            Array.from(grouped.entries()).map(([category, comps]) => (
              <div key={category} className="component-category">
                <div
                  className="category-header"
                  onClick={() => toggleCategoryExpansion(category)}
                >
                  <span className="category-toggle">
                    {expandedCategories.has(category) ? '▼' : '▶'}
                  </span>
                  <h4>{category}</h4>
                  <span className="component-count">{comps.length}</span>
                </div>

                {expandedCategories.has(category) && (
                  <div className="category-components">
                    {comps.map(component => (
                      <div
                        key={`${component.pluginId}-${component.componentId}`}
                        className="component-item"
                        draggable
                        onDragStart={(e) => handleDragStart(e, component)}
                        title={component.componentName}
                      >
                        {component.icon && (
                          <div className="component-icon">
                            {component.icon}
                          </div>
                        )}
                        <div className="component-info">
                          <div className="component-name">{component.componentName}</div>
                          <div className="component-id">{component.componentId}</div>
                        </div>
                        <div className="drag-handle">⋮⋮</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="palette-footer">
        <small>
          {components.length} component{components.length !== 1 ? 's' : ''} available
        </small>
      </div>
    </div>
  );
};
