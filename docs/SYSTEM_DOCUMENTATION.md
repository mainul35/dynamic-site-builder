# Dynamic Site Builder - System Documentation

This document provides comprehensive documentation for the Dynamic Site Builder CMS, covering authentication mechanisms, site and page management, menubar architecture, and system capabilities.

---

## Table of Contents

1. [Authentication System](#authentication-system)
   - [Backend Authentication](#backend-authentication)
   - [Frontend Authentication](#frontend-authentication)
   - [Security Features](#security-features)
   - [Dynamic Public API Patterns](#dynamic-public-api-patterns)
2. [Site Management](#site-management)
   - [Site Entity](#site-entity)
   - [Site Operations](#site-operations)
   - [Site API Endpoints](#site-api-endpoints)
3. [Page Management](#page-management)
   - [Page Entity](#page-entity)
   - [Page Operations](#page-operations)
   - [Page Versioning](#page-versioning)
   - [Page Hierarchy](#page-hierarchy)
4. [Menubar Architecture](#menubar-architecture)
   - [Component Structure](#component-structure)
   - [Menu Items](#menu-items)
   - [Keyboard Shortcuts](#keyboard-shortcuts)
5. [API Reference](#api-reference)
6. [Configuration](#configuration)

---

## Authentication System

The CMS implements a robust JWT-based authentication system with role-based access control, user approval workflows, and comprehensive security features.

### Backend Authentication

#### Core Components

| Component | File | Description |
|-----------|------|-------------|
| AuthController | `security/controller/AuthController.java` | REST endpoints for auth operations |
| JwtService | `security/service/JwtService.java` | JWT token generation and validation |
| AuthService | `security/service/AuthService.java` | Authentication business logic |
| JwtAuthenticationFilter | `security/filter/JwtAuthenticationFilter.java` | Request authentication filter |
| CmsSecurityConfig | `security/config/CmsSecurityConfig.java` | Spring Security configuration |

#### Authentication Endpoints

```
POST /api/auth/login          - Authenticate user, returns access and refresh tokens
POST /api/auth/register       - Register new user (requires admin approval)
POST /api/auth/refresh        - Refresh access token using refresh token
POST /api/auth/logout         - Logout current session
POST /api/auth/logout-all     - Logout from all sessions
GET  /api/auth/me             - Get current authenticated user profile
GET  /api/auth/check          - Check if user is authenticated
```

#### Token Configuration

| Token Type | Expiration | Purpose |
|------------|------------|---------|
| Access Token | 15 minutes | API request authorization |
| Refresh Token | 7 days | Obtaining new access tokens |

#### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| ADMIN | Full system access | All operations + user management |
| DESIGNER | Site design access | Create/edit sites and pages |
| VIEWER | Read-only access | View sites and pages |
| USER | Default role | Basic user access |

#### User Approval Workflow

New user registrations follow an approval workflow:

1. User registers via `/api/auth/register`
2. Account created with `PENDING` status
3. Admin reviews pending users at `/api/users/pending`
4. Admin approves (`/api/users/{id}/approve`) or rejects (`/api/users/{id}/reject`)
5. Approved users can login and access the system

### Frontend Authentication

#### Auth Store (Zustand)

Location: `frontend/src/stores/authStore.ts`

```typescript
interface AuthState {
  accessToken: string | null;      // Not persisted (memory only)
  refreshToken: string | null;     // Persisted to localStorage
  user: UserProfile | null;        // Persisted to localStorage
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Key Actions:**
- `setTokens(accessToken, refreshToken, expiresIn)` - Store tokens, schedule refresh
- `setUser(user)` - Update user profile
- `logout()` - Clear auth state, cleanup timers

**Helper Methods:**
- `hasRole(role)` - Check user role membership
- `isAdmin()` - Check for ADMIN role
- `isDesigner()` - Check for DESIGNER or ADMIN role

#### Auth Service

Location: `frontend/src/services/authService.ts`

```typescript
// Core Operations
login(request: LoginRequest): Promise<AuthResponse>
register(request: RegisterRequest): Promise<AuthResponse>
refreshToken(): Promise<AuthResponse>
logout(): Promise<void>
logoutAll(): Promise<void>

// Helpers
getCurrentUser(): Promise<UserProfile>
checkAuth(): Promise<boolean>
initializeAuth(): Promise<void>
getAccessToken(): string | null
hasRole(role: string): boolean
isAdmin(): boolean
```

#### API Interceptor

Location: `frontend/src/services/api.ts`

The API interceptor handles:
- Automatic `Authorization: Bearer {token}` header injection
- 401 response handling with automatic token refresh
- Request queuing during token refresh
- Logout on refresh failure

### Security Features

1. **Token Security**
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days) with rotation
   - SHA-256 hashing of stored refresh tokens
   - Token family tracking to detect reuse attacks

2. **Session Management**
   - IP address and User-Agent tracking
   - Active session counting
   - Logout-all capability
   - Automatic session cleanup

3. **Attack Prevention**
   - Token family revocation on reuse detection
   - BCrypt password hashing
   - Stateless JWT authentication (CSRF protection)
   - Role-based access control

### Dynamic Public API Patterns

The CMS supports runtime configuration of public API endpoints that bypass authentication. This allows site developers to expose specific API endpoints without modifying the codebase or restarting the server.

#### Architecture

The system uses a two-tier approach:

1. **Static Patterns** (application.properties) - Requires server restart
2. **Dynamic Patterns** (database) - No restart needed, changes take effect immediately

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│ HTTP Request│────>│ DynamicPublicApiFilter│────>│ JwtAuthFilter   │
│             │     │ (checks DB patterns) │     │                 │
└─────────────┘     └──────────────────────┘     └─────────────────┘
                              │                          │
                              │ Match found?             │
                              │ ───────────────>         │
                              │ Set anonymous auth       │
                              │                          │
                              │ No match?                │
                              │ ─────────────────────────│───> Requires JWT
```

#### Core Components

| Component | File | Description |
|-----------|------|-------------|
| PublicApiPattern | `security/entity/PublicApiPattern.java` | JPA entity for patterns |
| PublicApiPatternRepository | `security/repository/PublicApiPatternRepository.java` | Data access layer |
| PublicApiPatternService | `security/service/PublicApiPatternService.java` | Business logic with caching |
| DynamicPublicApiFilter | `security/filter/DynamicPublicApiFilter.java` | Security filter |
| PublicApiPatternController | `security/controller/PublicApiPatternController.java` | Admin REST API |

#### Pattern Entity

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key |
| pattern | String | Ant-style URL pattern (e.g., `/api/sample/**`) |
| httpMethods | String | Comma-separated methods (e.g., `GET,POST`) or `*` for all |
| description | String | Optional documentation |
| enabled | Boolean | Toggle without deletion |
| createdBy | Long | User who created the pattern |
| createdAt | Timestamp | Creation time |
| updatedAt | Timestamp | Last update time |

#### Pattern Matching

Patterns use Spring's `AntPathMatcher` for URL matching:

| Pattern | Matches | Does Not Match |
|---------|---------|----------------|
| `/api/products/*` | `/api/products/123` | `/api/products/123/details` |
| `/api/products/**` | `/api/products/123`, `/api/products/123/details` | `/api/orders/1` |
| `/api/*/items` | `/api/products/items`, `/api/orders/items` | `/api/products/123/items` |

#### Admin API Endpoints

```
GET    /api/admin/security/public-patterns           - List all patterns
GET    /api/admin/security/public-patterns/enabled   - List enabled patterns only
GET    /api/admin/security/public-patterns/{id}      - Get pattern by ID
POST   /api/admin/security/public-patterns           - Create new pattern
PUT    /api/admin/security/public-patterns/{id}      - Update pattern
DELETE /api/admin/security/public-patterns/{id}      - Delete pattern
PATCH  /api/admin/security/public-patterns/{id}/enabled - Toggle enabled state
POST   /api/admin/security/public-patterns/clear-cache  - Force cache refresh
POST   /api/admin/security/public-patterns/test      - Test if path matches
```

All endpoints require `ADMIN` role.

#### Frontend Integration

**Security Service**: `frontend/src/services/securityService.ts`

```typescript
// Get all patterns
const patterns = await securityService.getAllPatterns();

// Create new pattern
await securityService.createPattern({
  pattern: '/api/products/**',
  httpMethods: 'GET',
  description: 'Public product catalog',
  enabled: true
});

// Test if path would be public
const result = await securityService.testPath({
  path: '/api/products/123',
  method: 'GET'
});
console.log(result.isPublic); // true
```

**Admin UI**: Settings Modal → Security tab (admin users only)

The UI allows administrators to:
- View all configured patterns
- Add new patterns with validation
- Edit existing patterns
- Enable/disable patterns
- Delete patterns

#### Configuration

**Static patterns via application.properties:**

```properties
# Comma-separated Ant-style patterns
security.public-api-patterns=/api/sample/**,/api/products/**
```

**Environment variable:**

```bash
SECURITY_PUBLIC_API_PATTERNS=/api/sample/**,/api/products/**
```

#### Caching

Enabled patterns are cached using Spring's caching abstraction:
- Cache name: `publicApiPatterns`
- Automatic invalidation on create/update/delete operations
- Manual cache clear via admin API

#### Database Migration

File: `V9__add_public_api_patterns_table.sql`

Creates `public_api_patterns` table with index on `enabled` column and seeds default `/api/sample/**` pattern.

---

## Site Management

### Site Entity

Location: `sitebuilder/entity/Site.java`

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key |
| siteName | String | Site display name |
| siteSlug | String | URL-friendly identifier (unique) |
| siteMode | SiteMode | SINGLE_PAGE, MULTI_PAGE, FULL_SITE |
| description | String | Site description |
| ownerUserId | Long | Owner user ID |
| isPublished | Boolean | Publication status |
| publishedAt | LocalDateTime | Publication timestamp |
| domain | String | Custom domain |
| faviconUrl | String | Favicon URL |
| metadata | String | Custom JSON metadata |
| createdAt | LocalDateTime | Creation timestamp |
| updatedAt | LocalDateTime | Last update timestamp |

### Site Operations

#### Create Site

```typescript
// Frontend
await siteService.createSite({
  siteName: "My Website",
  siteSlug: "my-website",      // Optional, auto-generated
  siteMode: "MULTI_PAGE",      // Optional
  description: "My site"       // Optional
});
```

#### Update Site

```typescript
await siteService.updateSite(siteId, {
  siteName: "Updated Name",
  description: "New description",
  domainName: "example.com",
  faviconUrl: "/favicon.ico"
});
```

#### Publish/Unpublish Site

```typescript
await siteService.publishSite(siteId);
await siteService.unpublishSite(siteId);
```

### Site API Endpoints

```
GET    /api/sites              - Get all sites for user
GET    /api/sites/{id}         - Get site by ID
GET    /api/sites/slug/{slug}  - Get site by slug
POST   /api/sites              - Create new site
PUT    /api/sites/{id}         - Update site
DELETE /api/sites/{id}         - Delete site
POST   /api/sites/{id}/publish   - Publish site
POST   /api/sites/{id}/unpublish - Unpublish site
```

---

## Page Management

### Page Entity

Location: `sitebuilder/entity/Page.java`

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key |
| site | Site | Parent site (FK) |
| pageName | String | Page display name |
| pageSlug | String | URL-friendly identifier |
| pageType | PageType | STANDARD, TEMPLATE, HOMEPAGE |
| title | String | SEO title |
| description | String | SEO description |
| routePath | String | Custom route path |
| parentPage | Page | Parent page for hierarchy |
| displayOrder | Integer | Sort order among siblings |
| isPublished | Boolean | Publication status |
| publishedAt | LocalDateTime | Publication timestamp |
| layoutId | Long | Optional layout template |
| createdAt | LocalDateTime | Creation timestamp |
| updatedAt | LocalDateTime | Last update timestamp |

### Page Operations

#### Create Page

```typescript
await pageService.createPage(siteId, {
  pageName: "About Us",
  pageSlug: "about",           // Optional, auto-generated
  pageType: "STANDARD",        // Optional
  title: "About Our Company",  // Optional
  description: "Learn about us", // Optional
  routePath: "/about",         // Optional
  parentPageId: null,          // Optional, for hierarchy
  layoutId: null               // Optional
});
```

#### Update Page

```typescript
await pageService.updatePage(siteId, pageId, {
  pageName: "Updated Name",
  title: "New Title",
  parentPageId: newParentId    // For reparenting
});
```

#### Duplicate Page

```typescript
await pageService.duplicatePage(siteId, pageId, "Page Copy Name");
```

#### Reorder Pages

```typescript
await pageService.reorderPages(siteId, [
  { pageId: 1, displayOrder: 0 },
  { pageId: 2, displayOrder: 1 },
  { pageId: 3, displayOrder: 2 }
]);
```

### Page Versioning

Every save creates a new version, providing complete change history and rollback capability.

#### PageVersion Entity

| Field | Type | Description |
|-------|------|-------------|
| id | Long | Primary key |
| page | Page | Parent page (FK) |
| versionNumber | Integer | Auto-incrementing version |
| pageDefinition | TEXT | Complete page JSON |
| changeDescription | String | Description of changes |
| createdByUserId | Long | User who created version |
| isActive | Boolean | Currently active version |
| createdAt | LocalDateTime | Creation timestamp |

#### Version Operations

```typescript
// Get page definition (active version)
const definition = await pageService.getPageDefinition(siteId, pageId);

// Save new version
await pageService.savePageVersion(siteId, pageId, pageDefinition, "Added hero section");

// Get version history
const versions = await pageService.getPageVersions(siteId, pageId);

// Restore to previous version
await pageService.restorePageVersion(siteId, pageId, versionId);

// Delete old version (cannot delete active)
await pageService.deletePageVersion(siteId, pageId, versionId);
```

#### Version API Endpoints

```
GET  /api/sites/{siteId}/pages/{pageId}/definition              - Get active page definition
POST /api/sites/{siteId}/pages/{pageId}/versions                - Save new version
GET  /api/sites/{siteId}/pages/{pageId}/versions                - Get version history
GET  /api/sites/{siteId}/pages/{pageId}/versions/active         - Get active version
GET  /api/sites/{siteId}/pages/{pageId}/versions/{versionId}    - Get specific version
POST /api/sites/{siteId}/pages/{pageId}/versions/{versionId}/restore - Restore version
DELETE /api/sites/{siteId}/pages/{pageId}/versions/{versionId}  - Delete version
```

### Page Hierarchy

Pages support unlimited nesting through parent-child relationships.

#### Frontend Page Tree

Location: `frontend/src/components/page-tree/`

**Features:**
- Visual hierarchical display
- Expand/collapse functionality
- Drag-and-drop reordering
- Reparenting support
- Context menu actions
- Active page highlighting
- State persistence (localStorage)

**Drag-and-Drop Positions:**
- `before` - Insert before target (same level)
- `after` - Insert after target (same level)
- `inside` - Make target the parent

#### Site Manager Store

Location: `frontend/src/stores/siteManagerStore.ts`

```typescript
interface SiteManagerState {
  sites: Site[];
  currentSiteId: number | null;
  pages: Page[];
  pageTree: PageTreeNode[];
  expandedPageIds: Set<number>;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `loadSites()` - Load all user sites
- `selectSite(siteId)` - Select site and load pages
- `loadSitePages(siteId)` - Load pages for a site
- `createPage(...)` - Create new page
- `updatePage(...)` - Update page
- `deletePage(...)` - Delete page
- `duplicatePage(...)` - Duplicate page
- `reorderPages(...)` - Batch reorder
- `togglePageExpanded(pageId)` - Toggle tree node
- `expandAllPages()` / `collapseAllPages()` - Bulk operations

---

## Menubar Architecture

### Component Structure

The menubar uses a modular, reusable component architecture.

#### Core Components

Location: `frontend/src/components/menubar/`

| Component | File | Description |
|-----------|------|-------------|
| Menubar | `Menubar.tsx` | Main container component |
| Menu | `Menu.tsx` | Individual dropdown menu |
| MenuItem | `MenuItem.tsx` | Menu item within dropdowns |
| SubMenu | `SubMenu.tsx` | Nested submenu support |
| MenuDivider | `MenuDivider.tsx` | Visual separator |
| MenubarContext | `MenubarContext.tsx` | State management |

#### Builder Integration

Location: `frontend/src/components/builder/BuilderMenubar.tsx`

### Menu Items

#### File Menu
| Item | Shortcut | Description |
|------|----------|-------------|
| Save | Ctrl+S | Save current page |
| Save As... | - | Save with new name |
| Export > HTML | - | Export as HTML |
| Export > JSON | - | Download page as JSON |
| Export > Full Site Package | - | Export entire site |
| Import... | - | Import page definition |
| Page Settings... | - | Edit page properties |
| Close Page | - | Close current page |

#### Edit Menu
| Item | Shortcut | Description |
|------|----------|-------------|
| Undo | Ctrl+Z | Undo last action |
| Redo | Ctrl+Shift+Z | Redo undone action |
| Cut | Ctrl+X | Cut selected component |
| Copy | Ctrl+C | Copy selected component |
| Paste | Ctrl+V | Paste from clipboard |
| Delete | Del | Delete selected component |
| Select All | Ctrl+A | Select all components |
| Deselect | - | Clear selection |
| CSS Editor | Ctrl+E | Open CSS editor for component |
| Global Styles... | - | Edit global styles |

#### View Menu
| Item | Shortcut | Description |
|------|----------|-------------|
| Preview Mode | - | Switch to preview |
| Edit Mode | - | Switch to edit |
| Show Grid | - | Toggle grid visibility |
| Show Rulers | - | Toggle ruler visibility |
| Show Component Outlines | - | Toggle outlines |
| Zoom | - | 25% - 200% zoom levels |
| Components Panel | - | Toggle left panel |
| Properties Panel | - | Toggle right panel |

#### Site Menu
| Item | Description |
|------|-------------|
| Select Site | Dynamic site list with current indicator |
| New Site... | Create new site |
| Site Settings... | Edit site properties |
| Pages | Dynamic page list with navigation |
| New Page... | Create new page |
| Layouts... | Manage layouts |
| Global Styles... | Edit global styles |

#### Content Menu
| Item | Description |
|------|-------------|
| Content Repository | Browse content |
| Upload Content... | Upload new content |
| Images | Browse images |
| Videos | Browse videos |
| Documents | Browse documents |
| Manage Folders... | Organize content |

#### User Menu
| Item | Description |
|------|-------------|
| Profile | View/edit profile |
| Settings | User settings |
| Change Password | Update password |
| Sign Out | Logout |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save page |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+X | Cut component |
| Ctrl+C | Copy component |
| Ctrl+V | Paste component |
| Del | Delete component |
| Ctrl+A | Select all |
| Ctrl+E | Toggle CSS Editor |
| Escape | Close menus/panels |

#### Menu Navigation
| Key | Action |
|-----|--------|
| ArrowLeft/Right | Switch between top-level menus |
| ArrowDown/Up | Navigate menu items |
| Home/End | Jump to first/last item |
| Enter/Space | Activate item |
| Escape | Close menu |

### Accessibility

The menubar implements full accessibility support:
- ARIA roles: `menubar`, `menuitem`, `menu`, `separator`
- `aria-expanded` states on triggers
- `aria-haspopup` indicators
- `aria-disabled` states
- Focus management with `tabIndex`

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/login | No | User login |
| POST | /api/auth/register | No | User registration |
| POST | /api/auth/refresh | No | Refresh token |
| POST | /api/auth/logout | Yes | Logout session |
| POST | /api/auth/logout-all | Yes | Logout all sessions |
| GET | /api/auth/me | Yes | Get current user |
| GET | /api/auth/check | Yes | Check auth status |

### Site Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/sites | Yes | Get all sites |
| GET | /api/sites/{id} | Yes | Get site by ID |
| GET | /api/sites/slug/{slug} | Yes | Get site by slug |
| POST | /api/sites | Yes | Create site |
| PUT | /api/sites/{id} | Yes | Update site |
| DELETE | /api/sites/{id} | Yes | Delete site |
| POST | /api/sites/{id}/publish | Yes | Publish site |
| POST | /api/sites/{id}/unpublish | Yes | Unpublish site |

### Page Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/sites/{siteId}/pages | Yes | Get all pages |
| GET | /api/sites/{siteId}/pages/{pageId} | Yes | Get page by ID |
| GET | /api/sites/{siteId}/pages/slug/{slug} | Yes | Get page by slug |
| POST | /api/sites/{siteId}/pages | Yes | Create page |
| PUT | /api/sites/{siteId}/pages/{pageId} | Yes | Update page |
| DELETE | /api/sites/{siteId}/pages/{pageId} | Yes | Delete page |
| POST | /api/sites/{siteId}/pages/{pageId}/publish | Yes | Publish page |
| POST | /api/sites/{siteId}/pages/{pageId}/unpublish | Yes | Unpublish page |
| POST | /api/sites/{siteId}/pages/{pageId}/duplicate | Yes | Duplicate page |
| GET | /api/sites/{siteId}/pages/{parentId}/children | Yes | Get child pages |
| POST | /api/sites/{siteId}/pages/reorder | Yes | Reorder pages |

### Page Version Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /api/sites/{siteId}/pages/{pageId}/definition | Yes | Get page definition |
| POST | /api/sites/{siteId}/pages/{pageId}/versions | Yes | Save version |
| GET | /api/sites/{siteId}/pages/{pageId}/versions | Yes | Get version history |
| GET | /api/sites/{siteId}/pages/{pageId}/versions/active | Yes | Get active version |
| GET | /api/sites/{siteId}/pages/{pageId}/versions/{versionId} | Yes | Get version |
| POST | /api/sites/{siteId}/pages/{pageId}/versions/{versionId}/restore | Yes | Restore version |
| DELETE | /api/sites/{siteId}/pages/{pageId}/versions/{versionId} | Yes | Delete version |

---

## Configuration

### JWT Configuration

In `application.properties`:

```properties
app.jwt.secret=${JWT_SECRET:base64-encoded-secret}
app.jwt.access-token-expiration=900000    # 15 minutes
app.jwt.refresh-token-expiration=604800000 # 7 days
app.jwt.issuer=flashcard-cms
```

### Database Configuration

```properties
spring.datasource.url=jdbc:h2:file:./data/cms
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=validate
spring.flyway.enabled=true
```

### CORS Configuration

The security configuration allows:
- All origins (configurable)
- Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
- Headers: Authorization, Content-Type
- Exposed headers: Authorization

### Default Admin Account

Created via database migration:
- Username: `admin`
- Password: `admin123`
- Status: APPROVED
- Role: ADMIN

---

## How-To Guides

### How to Create a New Site

1. Login to the CMS
2. Click **Site > New Site...** in the menubar
3. Enter site name and optional description
4. Click Create
5. The new site is automatically selected

### How to Create a New Page

1. Select a site from **Site > Select Site**
2. Click **Site > New Page...**
3. Enter page name
4. Optionally select a parent page for hierarchy
5. Click Create
6. The page opens in the builder

### How to Save Page Changes

**Option 1: Keyboard Shortcut**
- Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)

**Option 2: Menu**
- Click **File > Save**

Changes are automatically versioned for history tracking.

### How to Restore a Previous Version

1. Access version history (not yet exposed in UI)
2. View available versions with timestamps
3. Select version to restore
4. Confirm restoration
5. A new version is created with the restored content

### How to Reorder Pages

**Drag and Drop:**
1. In the page tree, drag a page
2. Drop at desired position:
   - Above/below for same level
   - On top of another page to make it a child

**Programmatically:**
```typescript
await siteManagerStore.reorderPages(siteId, [
  { pageId: 1, displayOrder: 0 },
  { pageId: 2, displayOrder: 1 }
]);
```

### How to Export a Page

1. Open the page in the builder
2. Click **File > Export > JSON**
3. The page definition downloads as a JSON file

### How to Import a Page

1. Click **File > Import...**
2. Select a JSON file with valid page definition
3. The page content replaces current page content
4. Save to persist changes

---

## Architecture Diagrams

### Authentication Flow

```
┌─────────┐     ┌──────────┐     ┌─────────────┐     ┌──────────┐
│ Client  │────>│ API      │────>│ JWT Filter  │────>│ Auth     │
│         │     │ Gateway  │     │             │     │ Service  │
└─────────┘     └──────────┘     └─────────────┘     └──────────┘
     │                                                     │
     │  1. Login Request                                   │
     │ ─────────────────────────────────────────────────> │
     │                                                     │
     │  2. Access Token + Refresh Token                    │
     │ <───────────────────────────────────────────────── │
     │                                                     │
     │  3. API Request (Bearer Token)                      │
     │ ─────────────────────────────────────────────────> │
     │                                                     │
     │  4. Token Validation & Response                     │
     │ <───────────────────────────────────────────────── │
     │                                                     │
     │  5. Token Expired (401)                             │
     │ <───────────────────────────────────────────────── │
     │                                                     │
     │  6. Refresh Token Request                           │
     │ ─────────────────────────────────────────────────> │
     │                                                     │
     │  7. New Token Pair                                  │
     │ <───────────────────────────────────────────────── │
```

### Page Save Flow

```
┌────────────┐     ┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Builder    │────>│ pageService │────>│ PageController   │────>│ PageVersion     │
│ UI         │     │             │     │                  │     │ Service         │
└────────────┘     └─────────────┘     └──────────────────┘     └─────────────────┘
      │                   │                    │                        │
      │ 1. Ctrl+S         │                    │                        │
      │ ────────────────> │                    │                        │
      │                   │                    │                        │
      │                   │ 2. savePageVersion │                        │
      │                   │ (JSON.stringify)   │                        │
      │                   │ ─────────────────> │                        │
      │                   │                    │                        │
      │                   │                    │ 3. Deactivate old     │
      │                   │                    │    Create new version  │
      │                   │                    │ ─────────────────────> │
      │                   │                    │                        │
      │                   │                    │ 4. PageVersionDto      │
      │                   │                    │ <───────────────────── │
      │                   │                    │                        │
      │ 5. Success        │                    │                        │
      │ <──────────────── │                    │                        │
```

---

## Component Sizing Architecture

### Dimension Priority System

The system uses a consistent priority order for component dimensions across all contexts:

```
1. props.width/height     (Properties Panel - highest priority)
2. size.width/height      (Resize drag operations)
3. Context-aware defaults (100% for children, auto for root)
```

This applies to:
- **ResizableComponent.tsx** - Edit mode rendering and resize behavior
- **ImageRenderer.tsx** - Preview mode rendering
- **thymeleafExportService.ts** - Thymeleaf/Spring Boot export

### Flex Layout Behavior

Components with explicit dimensions properly escape parent flex stretch:

| Component State | Flex Behavior | Result |
|-----------------|---------------|--------|
| No explicit width | `alignSelf: undefined` | Stretches to parent width |
| Explicit width set | `alignSelf: flex-start` | Uses exact specified width |

### Resize Operations

The `ResizableComponent` wrapper provides resize handles for all components:

| Handle | Position | Resize Direction |
|--------|----------|------------------|
| n, s | Top, Bottom edges | Vertical only |
| e, w | Left, Right edges | Horizontal only |
| ne, nw, se, sw | Corners | Both directions |

**Resize behavior**:
- Drag operations update `component.size.width/height`
- Properties panel updates `component.props.width/height`
- Props take precedence over size (see priority system above)

---

## Thymeleaf Export Service

### Overview

Location: `frontend/src/services/thymeleafExportService.ts`

The export service generates a complete Spring Boot project with Thymeleaf templates from the visual builder pages.

### Template Variable Conversion

Builder uses `{{variable}}` syntax which is converted to Thymeleaf expressions:

| Builder Syntax | Thymeleaf Output | Context |
|----------------|------------------|---------|
| `{{item.name}}` | `${item.name}` | Simple variable |
| `Name: {{item.name}}` | `'Name: ' + ${item.name}` | Mixed text + variable |
| `{{item.name}} - {{item.price}}` | `${item.name} + ' - ' + ${item.price}` | Multiple variables |

### Component Export Functions

| Function | Description |
|----------|-------------|
| `generateThymeleafLabel` | Exports Label with th:text for template bindings |
| `generateThymeleafImage` | 3-level structure matching ImageRenderer |
| `generateThymeleafContainer` | Flex/grid layout with proper styling |
| `generateThymeleafRepeater` | th:each with grid/flex layout support |
| `generateThymeleafNavbar` | Navigation with th:href links |
| `generateThymeleafButton` | Button with th:href for navigation events |

### Export Package Structure

```
exported-project/
├── pom.xml
├── src/main/java/{package}/
│   ├── Application.java
│   └── controller/
│       └── PageController.java
├── src/main/resources/
│   ├── application.properties
│   ├── templates/           # Thymeleaf templates
│   │   └── {page-name}.html
│   ├── pages/               # Page data JSON
│   │   └── {page-name}.json
│   └── static/
│       ├── css/styles.css
│       ├── js/main.js
│       └── images/          # Downloaded images
└── README.md
```

### Image Handling

Images are automatically:
1. Collected from all page components
2. Downloaded from their URLs
3. Saved to `static/images/`
4. Referenced using Thymeleaf URL syntax `@{/images/filename.ext}`

---

## Plugin Frontend Development

This section covers how to develop the frontend (React) part of a plugin that renders components in the visual builder.

### Architecture Overview

```
Plugin Frontend Loading Flow:
┌─────────────────┐    ┌──────────────────┐    ┌────────────────────┐
│ BuilderCanvas   │───>│ PluginLoaderSvc  │───>│ /api/plugins/{id}/ │
│ needs renderer  │    │ loadPlugin()     │    │ bundle.js          │
└─────────────────┘    └──────────────────┘    └────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │ RendererRegistry │
                       │ register()       │
                       └──────────────────┘
```

Plugins are built as IIFE (Immediately Invoked Function Expression) bundles that:
1. Are served from the backend via `/api/plugins/{pluginId}/bundle.js`
2. Expose a global variable (e.g., `window.ButtonComponentPlugin`)
3. Register their renderers with the core RendererRegistry

### Frontend Directory Structure

```
plugins/{plugin-name}/
├── pom.xml                    # Maven build config
├── frontend/
│   ├── package.json           # NPM dependencies
│   ├── tsconfig.json          # TypeScript configuration
│   ├── vite.config.ts         # Vite build configuration
│   └── src/
│       ├── index.ts           # Main entry point
│       ├── types.ts           # TypeScript type definitions
│       ├── styles/            # Optional CSS files
│       │   └── {Component}.css
│       └── renderers/
│           └── {ComponentName}Renderer.tsx
└── src/main/
    └── resources/
        └── frontend/          # Build output directory
            ├── bundle.js      # Generated IIFE bundle
            └── bundle.css     # Generated CSS (optional)
```

### Step 1: Create package.json

```json
{
  "name": "@dynamic-site-builder/{plugin-name}",
  "version": "1.0.0",
  "private": true,
  "description": "Frontend bundle for {plugin-name}",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "build:watch": "vite build --watch"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.0",
    "vite": "^5.1.0"
  }
}
```

**Key points:**
- React is a `peerDependency` (provided by host application)
- No runtime dependencies in the bundle
- Build outputs to `../src/main/resources/frontend/`

### Step 2: Create vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    // Output to Maven resources directory
    outDir: resolve(__dirname, '../src/main/resources/frontend'),
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyComponentPlugin',  // Global variable name (PascalCase)
      formats: ['iife'],           // IIFE for browser loading
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      // React is provided by host app - don't bundle it
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
        },
        extend: true,
        exports: 'named',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') {
            return 'bundle.css';
          }
          return assetInfo.name || 'asset';
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
});
```

**Important:** The `name` must match the entry in `PLUGIN_GLOBAL_NAMES` in `pluginLoaderService.ts`.

### Step 3: Create types.ts

```typescript
/**
 * Type definitions for plugin renderers
 */

export interface ComponentPosition {
  x: number;
  y: number;
}

export interface ComponentSize {
  width: number;
  height: number;
}

export interface ComponentInstance {
  instanceId: string;
  pluginId: string;
  componentId: string;
  componentCategory?: string;
  parentId?: string | null;
  position: ComponentPosition;
  size: ComponentSize;
  props: Record<string, unknown>;
  styles: Record<string, string>;
  children?: ComponentInstance[];
  zIndex?: number;
  displayOrder?: number;
  isVisible?: boolean;
}

export interface RendererProps {
  component: ComponentInstance;
  isEditMode: boolean;
}

export type RendererComponent = React.FC<RendererProps>;

export interface PluginBundle {
  pluginId: string;
  renderers: Record<string, RendererComponent>;
  styles?: string;
  version?: string;
}
```

### Step 4: Create Renderer Components

Location: `frontend/src/renderers/{ComponentName}Renderer.tsx`

**Naming Convention:** The filename must be `{ComponentId}Renderer.tsx` where `ComponentId` matches the component ID registered in the Java plugin.

```tsx
import React, { useState } from 'react';
import type { RendererProps } from '../types';

/**
 * MyComponentRenderer - Description of what this renders
 */
const MyComponentRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  // Extract props with defaults
  const {
    text = 'Default Text',
    variant = 'primary',
    disabled = false,
  } = component.props;

  // Handle edit mode (prevent interactions in builder)
  const handleClick = (e: React.MouseEvent) => {
    if (isEditMode) {
      e.preventDefault();
      return;
    }
    // Production behavior
  };

  // Build styles
  const containerStyles: React.CSSProperties = {
    padding: '16px',
    backgroundColor: component.styles.backgroundColor || '#ffffff',
    borderRadius: component.styles.borderRadius || '8px',
    ...component.styles,
  };

  return (
    <div style={containerStyles} onClick={handleClick}>
      {text as string}
    </div>
  );
};

export default MyComponentRenderer;
export { MyComponentRenderer };
```

**Best Practices:**

1. **Extract props with defaults:**
   ```tsx
   const { text = 'Default', size = 'medium' } = component.props;
   ```

2. **Handle isEditMode:** Disable interactions in edit mode
   ```tsx
   if (isEditMode) {
     e.preventDefault();
     return;
   }
   ```

3. **Apply component.styles:** Merge with default styles
   ```tsx
   const styles = {
     ...defaultStyles,
     ...component.styles,
   };
   ```

4. **Type casting for props:**
   ```tsx
   {text as string}
   {disabled as boolean}
   ```

### Step 5: Create index.ts (Entry Point)

```typescript
/**
 * {PluginName} - Frontend Bundle
 */
import type { PluginBundle, RendererComponent } from './types';
import MyComponentRenderer from './renderers/MyComponentRenderer';

// PLUGIN_ID must match the Java plugin's ID exactly
export const PLUGIN_ID = 'my-component-plugin';

// Map of componentId -> renderer
export const renderers: Record<string, RendererComponent> = {
  MyComponent: MyComponentRenderer,
};

// Plugin bundle for dynamic loader
export const pluginBundle: PluginBundle = {
  pluginId: PLUGIN_ID,
  renderers,
  version: '1.0.0',
};

// Named exports for direct imports
export { MyComponentRenderer };

// Default export
export default pluginBundle;

// Self-registration function (called by host app)
export function registerRenderers(registry: {
  register: (componentId: string, renderer: RendererComponent, pluginId?: string) => void;
}): void {
  Object.entries(renderers).forEach(([componentId, renderer]) => {
    registry.register(componentId, renderer, PLUGIN_ID);
  });
  console.log(`[${PLUGIN_ID}] Registered ${Object.keys(renderers).length} renderers`);
}
```

**Multiple Renderers Example (Navbar plugin):**

```typescript
export const renderers: Record<string, RendererComponent> = {
  Navbar: NavbarRenderer,
  NavbarDefault: NavbarDefaultRenderer,
  NavbarCentered: NavbarCenteredRenderer,
  NavbarDark: NavbarDarkRenderer,
};
```

### Step 6: Register Plugin in PluginLoaderService

Add your plugin to `frontend/src/services/pluginLoaderService.ts`:

```typescript
const PLUGIN_GLOBAL_NAMES: Record<string, string> = {
  // ... existing plugins
  'my-component-plugin': 'MyComponentPlugin',  // Add your plugin
};
```

For core plugins (bundled with the CMS):

```typescript
const VIRTUAL_PLUGIN_MAPPINGS: Record<string, string[]> = {
  'core-ui': [
    // ... existing plugins
    'my-component-plugin',  // Add to core-ui if it's a UI component
  ],
};
```

### Step 7: Add CSS Styles (Optional)

Create: `frontend/src/styles/MyComponent.css`

```css
/* MyComponent Styles */
.my-component {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.my-component-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}
```

Import in renderer:
```tsx
import '../styles/MyComponent.css';
```

### Step 8: Build the Frontend

```bash
cd plugins/my-component-plugin/frontend
npm install
npm run build
```

The build outputs to `../src/main/resources/frontend/`:
- `bundle.js` - IIFE JavaScript bundle
- `bundle.css` - CSS styles (if any)

### Renderer Patterns

#### Simple Component

```tsx
const LabelRenderer: React.FC<RendererProps> = ({ component }) => {
  const { text = 'Label', fontSize = '14px' } = component.props;

  return (
    <span style={{ fontSize, ...component.styles }}>
      {text as string}
    </span>
  );
};
```

#### Component with State

```tsx
const ButtonRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => isEditMode && e.preventDefault()}
      style={{
        backgroundColor: isHovered ? '#0056b3' : '#007bff',
        ...component.styles,
      }}
    >
      {component.props.text as string}
    </button>
  );
};
```

#### Container with Children

```tsx
const ContainerRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const { layoutMode = 'flex-column', padding = '20px' } = component.props;

  const layoutStyles = layoutMode === 'flex-row'
    ? { display: 'flex', flexDirection: 'row' }
    : { display: 'flex', flexDirection: 'column' };

  return (
    <div style={{ ...layoutStyles, padding, ...component.styles }}>
      {/* Children are rendered by BuilderCanvas in edit mode */}
      {/* In preview mode, parent component handles children */}
    </div>
  );
};
```

#### Form Component

```tsx
const LoginFormRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) return;

    // Call API endpoint from props
    const response = await fetch(component.props.loginEndpoint as string);
    // Handle response
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isEditMode}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={isEditMode}
      />
      <button type="submit" disabled={isEditMode}>
        {component.props.submitText as string || 'Sign In'}
      </button>
    </form>
  );
};
```

### Debugging Plugin Loading

Enable console logging to debug plugin loading:

```typescript
// In browser console:
// Check loaded plugins
window.ButtonComponentPlugin  // Should show plugin bundle

// Check registry
RendererRegistry.debugGetAllKeys()  // Shows all registered renderers

// Manual loading
import('/api/plugins/my-plugin/bundle.js')
```

### Common Issues

| Issue | Solution |
|-------|----------|
| "Plugin global not found" | Ensure `PLUGIN_GLOBAL_NAMES` matches vite config `name` |
| "jsxRuntime is not available" | Check React is loaded before plugin bundle |
| Renderer not found | Verify componentId matches between Java and TypeScript |
| Styles not applied | Check CSS import and build output |
| Edit mode interactions | Ensure `isEditMode` check prevents clicks/inputs |

---

## Related Documentation

- [CHANGELOG.md](./CHANGELOG.md) - Detailed change history and bug fixes

---

*Documentation last updated: January 2025*
