# Dynamic Site Builder - Changelog

All notable changes to this project are documented here. This document covers architectural changes, bug fixes, and new features.

---

## [Unreleased] - January 2025

### Dynamic Public API Patterns

#### Feature: Runtime-Configurable Public API Endpoints

Added the ability to configure which API endpoints are publicly accessible without authentication, directly from the admin UI without server restart.

**Problem solved**: Previously, exposing API endpoints (like `/api/sample/**` for testing data sources) required modifying the security configuration and restarting the server.

**Solution**: Two-tier approach with static patterns (properties file) and dynamic patterns (database).

#### Backend Components

| File | Description |
|------|-------------|
| `security/entity/PublicApiPattern.java` | JPA entity storing pattern, HTTP methods, description, enabled flag |
| `security/repository/PublicApiPatternRepository.java` | Data access with custom queries for enabled patterns |
| `security/service/PublicApiPatternService.java` | Business logic with Spring caching and Ant-style path matching |
| `security/filter/DynamicPublicApiFilter.java` | Security filter that sets anonymous auth for matching paths |
| `security/controller/PublicApiPatternController.java` | Admin REST API at `/api/admin/security/public-patterns` |
| `config/CacheConfig.java` | Enables Spring caching for pattern lookups |
| `config/SecurityProperties.java` | Configuration properties for static patterns |

#### Frontend Components

| File | Description |
|------|-------------|
| `services/securityService.ts` | TypeScript API client for pattern management |
| `components/admin/PublicApiPatternsSection.tsx` | React component for pattern CRUD |
| `components/admin/PublicApiPatternsSection.css` | Styling for the admin UI |
| `components/modals/SettingsModal.tsx` | Added Security tab for admin users |

#### Database Migration

File: `V9__add_public_api_patterns_table.sql`

- Creates `public_api_patterns` table
- Adds index on `enabled` column
- Seeds default `/api/sample/**` pattern

#### API Endpoints (Admin only)

```
GET    /api/admin/security/public-patterns           - List all
POST   /api/admin/security/public-patterns           - Create
PUT    /api/admin/security/public-patterns/{id}      - Update
DELETE /api/admin/security/public-patterns/{id}      - Delete
PATCH  /api/admin/security/public-patterns/{id}/enabled - Toggle
POST   /api/admin/security/public-patterns/test      - Test path
```

---

### Dynamic CORS Configuration

#### Feature: Environment-Based CORS Settings

CORS origins and methods are now configurable via `application.properties` or environment variables.

**Files modified**:
- `config/CorsProperties.java` - New configuration properties class
- `config/WebConfig.java` - Uses dynamic CORS properties
- `sitebuilder/controller/SampleDataController.java` - Removed redundant `@CrossOrigin`

**Configuration**:

```properties
cors.allowed-origins=http://localhost:5173,http://localhost:3000
cors.allowed-methods=GET,POST,PUT,DELETE,OPTIONS
cors.allow-credentials=true
```

---

### Data Source Test Error Handling

#### Fixed: False "Success" on HTTP Error Responses

**Problem**: Testing API data sources showed "Test Successful" even when the API returned 403 Forbidden.

**Solution**: Updated `PropertiesPanel.tsx` to properly check response status and display detailed error information.

**Improvements**:
- Parse response body before checking status code
- Build detailed error messages with status, endpoint, method
- Include server error message, path, timestamp when available
- Add helpful hints for common errors (401, 403, 404)

**File**: `frontend/src/components/builder/PropertiesPanel.tsx`

**CSS Enhancement**: `frontend/src/components/builder/DataSourceEditor.css`
- Added pre-wrap for multiline error messages
- Monospace font for error details
- Scrollable container for long errors

---

### Thymeleaf Export API Endpoint Detection

#### Feature: Generate Spring MVC Controllers from Data Sources

The Thymeleaf export now detects API endpoints configured in Repeater components and generates corresponding Spring MVC controller methods.

**File**: `frontend/src/services/thymeleafExportService.ts`

**New capabilities**:
- Detect API endpoints from component data source configurations
- Generate controller classes with RestTemplate calls
- Add Lombok dependency when API endpoints are detected
- Generate proper Spring MVC route mappings

---

## [Previous] - December 2024

### Thymeleaf Export Service Improvements

#### Fixed: Thymeleaf Expression Parsing Error
**Issue**: Mixed literal text with template variables caused parsing errors.
- Error: `Could not parse as expression: "Name: ${item.name}"`

**Solution**: Created `convertToThymeleafExpression()` function that properly handles string concatenation in Thymeleaf.

**File**: `frontend/src/services/thymeleafExportService.ts` (lines 91-134)

```typescript
// Example transformations:
// "Name: {{item.name}}" -> "'Name: ' + ${item.name}"
// "{{item.name}}" -> "${item.name}"
// "{{item.name}} - {{item.price}}" -> "${item.name} + ' - ' + ${item.price}"
```

#### Fixed: Image Component Export Structure
**Issue**: Images expanded to full page size in exported site, not matching preview.

**Solution**: Rewrote `generateThymeleafImage()` to replicate the 3-level structure from `ImageRenderer.tsx`:
1. Container div (controls overall dimensions)
2. Wrapper div (handles aspect ratio, background)
3. Image element (with object-fit styling)

**File**: `frontend/src/services/thymeleafExportService.ts` (lines 182-292)

**Key improvements**:
- Respects explicit width/height from Properties panel
- Handles both string ("150px") and numeric (150) dimension values
- Applies `flexShrink: 0` and `flexGrow: 0` when explicit dimensions are set
- Proper `objectFit` and `objectPosition` styling

#### Fixed: Repeater Grid Layout Export
**Issue**: Repeater showed single-column layout in export instead of configured grid (e.g., 3-column).

**Solution**: Added `getRepeaterLayoutStyles()` function that matches `RepeaterRenderer.tsx` behavior.

**File**: `frontend/src/services/thymeleafExportService.ts` (lines 428-566)

**Supported layouts**:
- `flex-column` (default)
- `flex-row`
- `grid-2col`, `grid-3col`, `grid-4col`
- `grid-auto` (auto-fill with minmax)

#### Fixed: Repeater Child Styling Preservation
**Issue**: Cards inside repeater lost their borders and backgrounds in export.

**Root cause**: Children were rendered at `depth + 2`, triggering nested container cleanup logic that stripped styling.

**Solution**: Render repeater children at `depth 0` to preserve their full styling (borders, backgrounds, etc.) since they are the "root" of each repeated item.

---

### ResizableComponent Improvements

#### Fixed: Properties Panel Width/Height Not Applied in Edit Mode
**Issue**: Setting explicit dimensions (e.g., 150px x 170px) in Properties panel was ignored; component still stretched to 100%.

**Solution**: Updated `getContainerStyles()` to check `component.props.width/height` in addition to `component.size.width/height`.

**File**: `frontend/src/components/builder/ResizableComponent.tsx` (lines 220-280)

**Priority order** (highest to lowest):
1. `props.width/height` (from Properties panel)
2. `size.width/height` (from resize drag operations)
3. Default values (100% for children, auto for root)

```typescript
const propsWidth = component.props?.width as string | undefined;
const propsHeight = component.props?.height as string | undefined;

// Child component width determination:
let childWidth: string | undefined;
if (propsWidth) {
  childWidth = propsWidth;  // Explicit width from Properties panel
} else if (isInGridLayout) {
  childWidth = undefined;   // Let grid control sizing
} else {
  childWidth = component.size.width || '100%';  // Fallback
}
```

#### Fixed: Width Cannot Be Resized (Only Height Works)
**Issue**: Components with explicit width couldn't be resized narrower because parent flex-column layout stretched them.

**Root cause**: In a `flex-column` layout, children stretch to full width by default (`align-items: stretch`).

**Solution**: Added `alignSelf: 'flex-start'` when component has explicit width set.

**File**: `frontend/src/components/builder/ResizableComponent.tsx` (line 266)

```typescript
return {
  position: 'relative',
  width: childWidth,
  height: childHeight,
  boxSizing: 'border-box',
  // CRITICAL: Prevent flex stretch from parent
  alignSelf: propsWidth ? 'flex-start' : undefined,
};
```

---

### Architecture Overview

#### Component Dimension Priority System

The system now uses a consistent priority order for component dimensions:

```
1. props.width/height     (Properties Panel - highest priority)
2. size.width/height      (Resize drag operations)
3. Context-aware defaults (100% for children, auto for root)
```

This applies to:
- `ResizableComponent.tsx` - Edit mode rendering
- `ImageRenderer.tsx` - Preview mode rendering
- `thymeleafExportService.ts` - Export generation

#### Flex Layout Behavior

Components with explicit dimensions now properly escape flex stretch behavior:

| Scenario | Before | After |
|----------|--------|-------|
| Image with explicit width in flex-column parent | Stretched to 100% width | Uses exact specified width |
| Image in export with explicit dimensions | Expanded to fill container | Uses exact specified dimensions |
| Resize handles on explicit-width components | Width handle didn't work | Both width and height resizable |

---

### Files Modified

| File | Changes |
|------|---------|
| `frontend/src/services/thymeleafExportService.ts` | Thymeleaf expression handling, Image export structure, Repeater grid layouts |
| `frontend/src/components/builder/ResizableComponent.tsx` | Props-based dimensions, align-self fix for flex layouts |

---

### Testing Checklist

#### Thymeleaf Export
- [ ] Labels with template variables export correctly (`th:text` with concatenation)
- [ ] Images with explicit dimensions export at correct size
- [ ] Repeater with grid-3col exports as 3-column grid
- [ ] Cards inside repeater preserve borders and backgrounds
- [ ] Images use `flexShrink: 0` when explicit width is set

#### Edit Mode (Builder)
- [ ] Image with explicit width shows at that width (not stretched)
- [ ] Image resize handles work for both width and height
- [ ] Container children with explicit dimensions don't stretch
- [ ] Grid layout children still work correctly

#### Preview Mode
- [ ] Image renders at explicit dimensions
- [ ] Repeater grid layouts display correctly
- [ ] All styling matches edit mode

---

### Known Limitations

1. **Width resize in edit mode**: Components must have explicit width set in Properties panel before width resize handles become effective. Without explicit width, the component defaults to 100% and `alignSelf` is not applied.

2. **Nested container styling**: Nested containers at depth > 0 have default card styling (borderRadius, boxShadow) stripped unless they have an intentional gradient/image background. This matches preview behavior.

---

*Last updated: December 31, 2024*
