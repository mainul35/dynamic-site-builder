# Visual Site Designer (VSD)

A visual drag-and-drop website builder platform with a plugin-based architecture for creating and exporting sites.

## Overview

Visual Site Designer (VSD) is a plugin-based CMS platform that allows users to visually design websites and export them as fully functional Spring Boot applications with Thymeleaf templates.

### Key Features

- **Visual Builder**: Drag-and-drop interface for designing pages
- **Plugin Architecture**: Extensible component system via JAR plugins
- **Multi-Site Support**: Manage multiple sites with page hierarchies
- **Version Control**: Full page version history with rollback capability
- **Export**: Generate complete Spring Boot + Thymeleaf projects
- **Authentication**: JWT-based auth with role-based access control

## Quick Start

### Prerequisites

- Java 21 or higher
- Maven 3.8+
- Node.js 20.10+ (for frontend)
- Docker (optional, for deployment)

### Development Setup

```bash
# 1. Install the BOM and SDK
cd vsd-cms-bom && mvn clean install && cd ..
cd flashcard-cms-plugin-sdk && mvn clean install && cd ..

# 2. Build everything
mvn clean install -DskipTests

# 3. Start the application
cd core && mvn spring-boot:run
```

The application will be available at:
- **Frontend**: http://localhost:8080
- **REST API**: http://localhost:8080/api/
- **H2 Console**: http://localhost:8080/h2-console (JDBC URL: `jdbc:h2:file:./data/flashcarddb`)

### Default Credentials

- Username: `admin`
- Password: `admin123`

### Frontend Development

For hot reload during development:

```bash
cd frontend
npm install
npm run dev    # Development server at http://localhost:5173
```

## Project Structure

```
dynamic-site-builder/
├── vsd-cms-bom/                 # Bill of Materials for dependency management
├── flashcard-cms-plugin-sdk/    # Plugin SDK (artifact: vsd-cms-plugin-sdk)
├── core/                        # Main Spring Boot application
├── site-runtime/                # Site runtime library
├── frontend/                    # React frontend (Visual Site Builder)
│   └── src/
│       ├── components/builder/  # Builder components and renderers
│       ├── services/            # API services, plugin loader
│       └── stores/              # Zustand state management
├── plugins/                     # Component plugins
│   ├── button-component-plugin/
│   ├── navbar-component-plugin/
│   ├── label-component-plugin/
│   ├── container-layout-plugin/
│   ├── image-component-plugin/
│   └── ...
├── docker-compose.yml           # Docker deployment
└── pom.xml                      # Parent POM (multi-module)
```

## Plugin Development

### Creating a Plugin

1. Create a new Maven project importing the VSD BOM:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>dev.mainul35</groupId>
            <artifactId>vsd-cms-bom</artifactId>
            <version>1.0.0-SNAPSHOT</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>

<dependencies>
    <dependency>
        <groupId>dev.mainul35</groupId>
        <artifactId>vsd-cms-plugin-sdk</artifactId>
        <scope>provided</scope>
    </dependency>
</dependencies>
```

2. Implement the `ComponentPlugin` interface:

```java
package dev.mainul35.plugins;

import dev.mainul35.cms.sdk.plugin.ComponentPlugin;
import dev.mainul35.cms.sdk.registry.ComponentRegistry;

public class MyComponentPlugin implements ComponentPlugin {

    @Override
    public void registerComponents(ComponentRegistry registry) {
        registry.setPluginId("my-component-plugin");
        registry.registerComponent(
            "MyComponent",
            "My Component",
            "UI",
            Map.of(
                "text", "Default Text",
                "color", "#000000"
            )
        );
    }
}
```

3. Create `src/main/resources/plugin.yml`:

```yaml
plugin:
  id: my-component-plugin
  name: My Component Plugin
  version: 1.0.0
  mainClass: dev.mainul35.plugins.MyComponentPlugin
```

4. Build and deploy:

```bash
mvn clean package
cp target/my-component-plugin-1.0.0.jar ../plugins/
```

### Plugin Frontend (React Renderer)

Plugins can include React renderers for the visual builder:

```
plugins/my-plugin/
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── index.ts
│       └── renderers/
│           └── MyComponentRenderer.tsx
└── src/main/resources/
    └── frontend/
        └── bundle.js    # Built output
```

See existing plugins for complete examples.

### Compound/Composite Plugins

Compound plugins can import and compose renderers from other plugins. The VSD Component Helper IDE plugin automatically generates the required type definitions.

#### Example: Newsletter Form Plugin

```typescript
// Import renderers from other plugins
import { LabelRenderer } from '@vsd/label-component-plugin';
import { ButtonRenderer } from '@vsd/button-component-plugin';
import { TextboxRenderer } from '@vsd/textbox-component-plugin';

export const NewsletterFormRenderer: React.FC<Props> = ({ isEditMode }) => {
  return (
    <div>
      <LabelRenderer text="Subscribe" variant="h3" isEditMode={isEditMode} />
      <TextboxRenderer type="email" placeholder="Email" isEditMode={isEditMode} />
      <ButtonRenderer text="Subscribe" variant="primary" isEditMode={isEditMode} />
    </div>
  );
};
```

#### Configuration for Compound Plugins

1. Extend `tsconfig.json`:

```json
{
  "extends": "../../../generated-types/tsconfig.paths.json"
}
```

1. Add Vite aliases in `vite.config.ts`:

```typescript
import { createVsdAliases } from '../../../generated-types/vite.aliases';

export default defineConfig({
  resolve: {
    alias: createVsdAliases(__dirname),
  },
});
```

### Auto-Generated Types

The `generated-types/` directory is auto-generated by the VSD Component Helper IDE plugin when you open the project. It contains:

| File | Purpose |
| ---- | ------- |
| `plugins/<id>/index.ts` | Renderer exports for each plugin |
| `plugins/<id>/types.ts` | TypeScript interfaces for props/styles |
| `component-manifest.json` | Metadata for all plugins and components |
| `registry.ts` | Type-safe renderer lookup registry |
| `tsconfig.paths.json` | TypeScript path aliases for `@vsd/*` |
| `vite.aliases.ts` | Vite alias helpers for bundling |

**Note:** This directory is in `.gitignore` and will be regenerated automatically.

## API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |
| `/api/auth/refresh` | POST | Refresh token |
| `/api/auth/me` | GET | Current user profile |

### Sites

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites` | GET | Get all sites |
| `/api/sites` | POST | Create site |
| `/api/sites/{id}` | PUT | Update site |
| `/api/sites/{id}` | DELETE | Delete site |

### Pages

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sites/{siteId}/pages` | GET | Get all pages |
| `/api/sites/{siteId}/pages` | POST | Create page |
| `/api/sites/{siteId}/pages/{pageId}` | PUT | Update page |
| `/api/sites/{siteId}/pages/{pageId}/versions` | POST | Save version |

### Components

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/components` | GET | Get all registered components |
| `/api/plugins/{pluginId}/bundle.js` | GET | Get plugin frontend bundle |

## Deployment

### Docker Compose

```bash
docker-compose up -d
docker-compose logs -f vsd-app
```

### Cloudflare Tunnel (Recommended for Production)

1. Create a Cloudflare Tunnel at https://one.dash.cloudflare.com
2. Configure hostname pointing to `vsd-app:8080`
3. Create `.env`:
   ```
   CLOUDFLARE_TUNNEL_TOKEN=your-token-here
   ```
4. Deploy:
   ```bash
   docker-compose up -d
   ```

Benefits:
- No public ports exposed
- Automatic SSL
- Built-in DDoS protection

### Traditional Nginx + Let's Encrypt

```bash
chmod +x init-letsencrypt.sh
./init-letsencrypt.sh
docker-compose up -d
```

## Configuration

### Key Properties

```properties
# Server
server.port=8080

# Database
spring.datasource.url=jdbc:h2:file:./data/flashcarddb
spring.jpa.hibernate.ddl-auto=update

# Plugin System
app.plugin.directory=plugins
app.plugin.hot-reload.enabled=true

# JWT
app.jwt.access-token-expiration=900000
app.jwt.refresh-token-expiration=604800000

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:h2:file:./data/vsd-db` | Database URL |
| `SERVER_PORT` | `8080` | Application port |
| `PLUGIN_DIRECTORY` | `plugins` | Plugin directory |

## Troubleshooting

### Port Already in Use

```properties
server.port=8081
```

### Schema Validation Error

```bash
rm -rf data/flashcarddb.mv.db
cd core && mvn spring-boot:run
```

### Plugin Not Loading

1. Verify JAR is in `plugins/` directory
2. Check `plugin.yml` format
3. Review logs: `docker-compose logs vsd-app | grep -i plugin`

## License

[Your License Here]
