# Dynamic Site Builder - System Documentation

This document provides comprehensive documentation for the Dynamic Site Builder CMS, covering authentication mechanisms, site and page management, menubar architecture, and system capabilities.

---

## Table of Contents

1. [Authentication System](#authentication-system)
   - [Backend Authentication](#backend-authentication)
   - [Frontend Authentication](#frontend-authentication)
   - [Security Features](#security-features)
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

*Documentation last updated: December 2024*
