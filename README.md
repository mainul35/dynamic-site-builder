# Visual Site Builder Platform

A plugin-based visual site builder platform with drag-and-drop components, live CSS editing, and extensible architecture.

## Table of Contents

- [Quick Start](#quick-start)
- [Running the Application](#running-the-application)
- [Plugin Development](#plugin-development)
- [Plugin Management](#plugin-management)
- [Architecture](#architecture)
- [API Reference](#api-reference)

---

## Quick Start

### Prerequisites

- **Java**: JDK 21 or higher
- **Maven**: 3.6+
- **Node.js**: 20.10.0+ (for frontend)
- **npm**: 10.2.3+

### Run the Application

```bash
# 1. Build and start backend (includes frontend build)
cd core
mvn spring-boot:run

# Backend runs on: http://localhost:8080
# Frontend served at: http://localhost:8080

# 2. For development with hot reload, start frontend separately:
cd frontend
npm install
npm run dev

# Frontend dev server: http://localhost:5173 or http://localhost:5174
```

### Access the Builder

Open your browser and navigate to:
- **Production**: http://localhost:8080
- **Development**: http://localhost:5173/builder/new

You'll see the Visual Site Builder with:
- **Component Palette** (left) - Available UI components
- **Canvas** (center) - Drag-and-drop workspace
- **Properties Panel** (right) - Component customization

---

## Running the Application

### Backend Only

```bash
cd core
mvn clean install -DskipTests
mvn spring-boot:run
```

**Configuration** (`core/src/main/resources/application.properties`):
```properties
# Server
server.port=8080

# Database (H2 embedded)
spring.datasource.url=jdbc:h2:file:./data/flashcarddb

# Plugin System
app.plugin.directory=plugins
app.plugin.hot-reload.enabled=true
app.plugin.validation.enabled=true
```

### Frontend Only (Development)

```bash
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd core
mvn clean package -DskipTests

# Run the JAR
java -jar target/core-1.0.0-SNAPSHOT.jar
```

### Database Management

Access H2 Console at: http://localhost:8080/h2-console

**Connection Details**:
- JDBC URL: `jdbc:h2:file:./data/flashcarddb`
- Username: `sa`
- Password: (empty)

---

## Plugin Development

### Overview

Plugins extend the Visual Site Builder with custom UI components. Each plugin is a self-contained JAR file that:
- Implements the Plugin SDK interfaces
- Provides React components for the builder
- Defines component properties and styles
- Handles lifecycle events (load, activate, deactivate, uninstall)

### Plugin Architecture

```mermaid
graph TB
    subgraph "Plugin JAR"
        A[plugin.yml<br/>Metadata] --> B[Java Plugin Class<br/>UIComponentPlugin]
        B --> C[Component Manifest<br/>Props, Styles, Constraints]
        B --> D[React Component<br/>MyComponent.jsx]
        B --> E[Resources<br/>Icons, Assets]
    end

    subgraph "Core Platform"
        F[PluginManager<br/>Loads & Manages] --> G[ComponentRegistry<br/>Registers Components]
        G --> H[Component API<br/>REST Endpoints]
    end

    subgraph "Frontend Builder"
        I[Component Palette<br/>Browse] --> J[Canvas<br/>Drag & Drop]
        J --> K[Properties Panel<br/>Customize]
    end

    B -.->|Loaded by| F
    H -.->|Fetched by| I
    D -.->|Rendered in| J
```

### Plugin Lifecycle

```mermaid
sequenceDiagram
    participant PM as PluginManager
    participant PL as Plugin (JAR)
    participant CR as ComponentRegistry
    participant DB as Database
    participant UI as Frontend

    Note over PM: Application Startup
    PM->>PM: Scan plugins/ directory
    PM->>PL: Load plugin.yml
    PM->>PL: Create ClassLoader
    PM->>PL: Instantiate plugin class

    Note over PL: Plugin Initialization
    PL->>PL: onLoad(context)
    PL->>PL: Build ComponentManifest
    PL-->>PM: Return manifest

    PM->>CR: Register component
    CR->>DB: Save to cms_component_registry

    Note over PL: Plugin Activation
    PM->>PL: onActivate(context)
    PL-->>PM: Ready

    Note over UI: User Opens Builder
    UI->>CR: GET /api/components
    CR-->>UI: Component list
    UI->>UI: Display in palette

    Note over UI: User Uses Component
    UI->>CR: GET /manifest
    CR-->>UI: Props, styles, constraints
    UI->>UI: Render with React component
```

### Development Workflow

```mermaid
flowchart LR
    A[1. Create<br/>Plugin Structure] --> B[2. Define<br/>plugin.yml]
    B --> C[3. Implement<br/>Java Plugin Class]
    C --> D[4. Create<br/>React Component]
    D --> E[5. Build<br/>Maven Package]
    E --> F[6. Deploy<br/>to plugins/]
    F --> G{Test in<br/>Builder}
    G -->|Issues Found| C
    G -->|Success| H[7. Publish]

    style A fill:#e1f5ff
    style H fill:#d4edda
```

---

### Step-by-Step Guide

#### 1. Create Plugin Structure

```bash
mkdir -p plugins/my-component-plugin/src/main/java/com/example/plugins
mkdir -p plugins/my-component-plugin/src/main/resources/components
cd plugins/my-component-plugin
```

### 2. Create `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example.plugins</groupId>
    <artifactId>my-component-plugin</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>My Component Plugin</name>
    <description>Custom UI component for site builder</description>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Plugin SDK -->
        <dependency>
            <groupId>dev.mainul35</groupId>
            <artifactId>flashcard-cms-plugin-sdk</artifactId>
            <version>1.0.0-SNAPSHOT</version>
            <scope>provided</scope>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <version>1.18.34</version>
            <scope>provided</scope>
        </dependency>

        <!-- SLF4J -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.9</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <source>21</source>
                    <target>21</target>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### 3. Create `plugin.yml`

```yaml
plugin-id: my-component-plugin
plugin-name: My Component
version: 1.0.0
author: Your Name
description: A custom UI component
main-class: com.example.plugins.MyComponentPlugin
plugin-type: ui-component

ui-component:
  component-id: my-component
  display-name: My Component
  category: ui
  icon: 🎨
  description: Custom component description
  default-width: 200px
  default-height: 60px
  resizable: true
  min-width: 100px
  max-width: 600px
  min-height: 40px
  max-height: 200px
  react-component-path: /components/MyComponent.jsx
```

### 4. Create Plugin Java Class

```java
package com.example.plugins;

import dev.mainul35.cms.sdk.Plugin;
import dev.mainul35.cms.sdk.PluginContext;
import dev.mainul35.cms.sdk.UIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.*;
import lombok.extern.slf4j.Slf4j;

import java.util.*;

@Slf4j
@UIComponent(
    componentId = "my-component",
    displayName = "My Component",
    category = "ui",
    icon = "🎨",
    resizable = true,
    defaultWidth = "200px",
    defaultHeight = "60px"
)
public class MyComponentPlugin implements UIComponentPlugin {

    private PluginContext context;
    private ComponentManifest manifest;

    @Override
    public void onLoad(PluginContext context) throws Exception {
        this.context = context;
        log.info("Loading My Component Plugin");
        this.manifest = buildComponentManifest();
        log.info("My Component Plugin loaded successfully");
    }

    @Override
    public void onActivate(PluginContext context) throws Exception {
        log.info("Activating My Component Plugin");
    }

    @Override
    public void onDeactivate(PluginContext context) throws Exception {
        log.info("Deactivating My Component Plugin");
    }

    @Override
    public void onUninstall(PluginContext context) throws Exception {
        log.info("Uninstalling My Component Plugin");
    }

    @Override
    public ComponentManifest getComponentManifest() {
        return manifest;
    }

    @Override
    public String getReactComponentPath() {
        return "/components/MyComponent.jsx";
    }

    @Override
    public byte[] getComponentThumbnail() {
        return null; // Optional: return image bytes
    }

    @Override
    public ValidationResult validateProps(Map<String, Object> props) {
        List<String> errors = new ArrayList<>();

        // Add validation logic
        if (props.containsKey("text")) {
            Object text = props.get("text");
            if (text != null && text.toString().length() > 200) {
                errors.add("Text must not exceed 200 characters");
            }
        }

        return ValidationResult.builder()
                .isValid(errors.isEmpty())
                .errors(errors)
                .build();
    }

    private ComponentManifest buildComponentManifest() {
        return ComponentManifest.builder()
                .componentId("my-component")
                .displayName("My Component")
                .category("ui")
                .icon("🎨")
                .description("Custom UI component")
                .pluginId("my-component-plugin")
                .pluginVersion("1.0.0")
                .reactComponentPath("/components/MyComponent.jsx")
                .defaultProps(buildDefaultProps())
                .defaultStyles(buildDefaultStyles())
                .configurableProps(buildConfigurableProps())
                .configurableStyles(buildConfigurableStyles())
                .sizeConstraints(buildSizeConstraints())
                .canHaveChildren(false)
                .build();
    }

    private Map<String, Object> buildDefaultProps() {
        Map<String, Object> props = new HashMap<>();
        props.put("text", "Hello World");
        props.put("color", "blue");
        return props;
    }

    private Map<String, String> buildDefaultStyles() {
        Map<String, String> styles = new HashMap<>();
        styles.put("padding", "10px");
        styles.put("borderRadius", "4px");
        return styles;
    }

    private List<PropDefinition> buildConfigurableProps() {
        List<PropDefinition> props = new ArrayList<>();

        props.add(PropDefinition.builder()
                .name("text")
                .type(PropDefinition.PropType.STRING)
                .label("Text")
                .defaultValue("Hello World")
                .required(true)
                .helpText("Component text content")
                .build());

        props.add(PropDefinition.builder()
                .name("color")
                .type(PropDefinition.PropType.SELECT)
                .label("Color")
                .defaultValue("blue")
                .options(List.of("red", "blue", "green", "yellow"))
                .helpText("Component color")
                .build());

        return props;
    }

    private List<StyleDefinition> buildConfigurableStyles() {
        List<StyleDefinition> styles = new ArrayList<>();

        styles.add(StyleDefinition.builder()
                .property("padding")
                .type(StyleDefinition.StyleType.SIZE)
                .label("Padding")
                .defaultValue("10px")
                .allowedUnits(List.of("px", "rem", "em"))
                .category("spacing")
                .build());

        return styles;
    }

    private SizeConstraints buildSizeConstraints() {
        return SizeConstraints.builder()
                .resizable(true)
                .defaultWidth("200px")
                .defaultHeight("60px")
                .minWidth("100px")
                .maxWidth("600px")
                .minHeight("40px")
                .maxHeight("200px")
                .build();
    }

    @Override
    public String getPluginId() {
        return "my-component-plugin";
    }

    @Override
    public String getName() {
        return "My Component";
    }

    @Override
    public String getVersion() {
        return "1.0.0";
    }

    @Override
    public String getDescription() {
        return "A custom UI component";
    }
}
```

### 5. Create React Component

`src/main/resources/components/MyComponent.jsx`:

```jsx
import React, { useState } from 'react';

const MyComponent = ({ text, color, onClick, styles }) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorStyles = {
    red: { backgroundColor: '#ff4444', color: 'white' },
    blue: { backgroundColor: '#4444ff', color: 'white' },
    green: { backgroundColor: '#44ff44', color: 'black' },
    yellow: { backgroundColor: '#ffff44', color: 'black' },
  };

  const baseStyles = {
    display: 'inline-block',
    padding: '10px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    userSelect: 'none',
  };

  const hoverStyles = {
    transform: 'scale(1.05)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
  };

  const componentStyles = {
    ...baseStyles,
    ...colorStyles[color],
    ...(isHovered ? hoverStyles : {}),
    ...styles, // User custom styles
  };

  return (
    <div
      style={componentStyles}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {text}
    </div>
  );
};

export default MyComponent;
```

### 6. Build the Plugin

```bash
cd plugins/my-component-plugin
mvn clean package
```

Output: `target/my-component-plugin-1.0.0.jar`

---

### Plugin Types and Categories

The platform supports different plugin types and component categories:

```mermaid
graph LR
    A[Plugin Types] --> B[UI Component<br/>Visual elements]
    A --> C[Layout<br/>Container components]
    A --> D[Feature<br/>Business logic]

    B --> E[Button, Input<br/>Label, Image]
    C --> F[Container, Grid<br/>Flexbox, Section]
    D --> G[Auth Widget<br/>Search, Comments]

    style B fill:#e3f2fd
    style C fill:#f3e5f5
    style D fill:#fff3e0
```

**Component Categories**:

| Category | Purpose | Can Have Children | Examples |
|----------|---------|-------------------|----------|
| `ui` | Basic UI elements | No | Button, Label, Image, Icon |
| `layout` | Container components | Yes | Container, Grid, Flexbox |
| `form` | Input components | No | Input, Textarea, Select |
| `feature` | Feature widgets | Maybe | Auth Widget, Search Bar |

---

### SDK API Reference

#### Core Interfaces

**1. UIComponentPlugin Interface**

```java
public interface UIComponentPlugin extends Plugin {
    // Component metadata
    ComponentManifest getComponentManifest();
    String getReactComponentPath();
    byte[] getComponentThumbnail();

    // Validation
    ValidationResult validateProps(Map<String, Object> props);
}
```

**2. Plugin Interface**

```java
public interface Plugin {
    // Lifecycle hooks
    void onLoad(PluginContext context) throws Exception;
    void onActivate(PluginContext context) throws Exception;
    void onDeactivate(PluginContext context) throws Exception;
    void onUninstall(PluginContext context) throws Exception;

    // Metadata
    String getPluginId();
    String getName();
    String getVersion();
    String getDescription();
}
```

**3. PluginContext**

```java
public interface PluginContext {
    // Access to platform services
    String getPluginId();
    Path getPluginDirectory();
    Path getDataDirectory();

    // Configuration
    Properties getConfiguration();
    void saveConfiguration(Properties config);

    // Logging
    Logger getLogger();
}
```

#### Component Manifest Builder

```mermaid
classDiagram
    class ComponentManifest {
        +String componentId
        +String displayName
        +String category
        +String icon
        +String description
        +Map defaultProps
        +Map defaultStyles
        +List configurableProps
        +List configurableStyles
        +SizeConstraints sizeConstraints
        +boolean canHaveChildren
    }

    class PropDefinition {
        +String name
        +PropType type
        +String label
        +Object defaultValue
        +List options
        +boolean required
        +String helpText
    }

    class StyleDefinition {
        +String property
        +StyleType type
        +String label
        +String defaultValue
        +List allowedUnits
        +String category
    }

    class SizeConstraints {
        +boolean resizable
        +String defaultWidth
        +String defaultHeight
        +String minWidth
        +String maxWidth
        +String minHeight
        +String maxHeight
        +boolean maintainAspectRatio
    }

    ComponentManifest --> PropDefinition
    ComponentManifest --> StyleDefinition
    ComponentManifest --> SizeConstraints
```

**PropDefinition Types**:

```java
public enum PropType {
    STRING,      // Text input
    NUMBER,      // Numeric input
    BOOLEAN,     // Checkbox
    SELECT,      // Dropdown (requires options)
    COLOR,       // Color picker
    IMAGE,       // Image upload
    RICH_TEXT,   // WYSIWYG editor
    JSON         // JSON editor
}
```

**StyleDefinition Types**:

```java
public enum StyleType {
    SIZE,        // Width, height, margin, padding (with units)
    COLOR,       // Color values
    SELECT,      // Predefined options
    NUMBER,      // Numeric values
    TEXT         // Free text (font-family, etc.)
}
```

---

### Best Practices

#### 1. **Plugin Structure**

```
my-component-plugin/
├── pom.xml
├── README.md
├── LICENSE
└── src/main/
    ├── java/com/example/plugins/
    │   └── MyComponentPlugin.java
    └── resources/
        ├── plugin.yml
        ├── components/
        │   └── MyComponent.jsx
        └── assets/
            ├── icon.png
            └── thumbnail.png
```

#### 2. **Naming Conventions**

| Element | Convention | Example |
|---------|-----------|---------|
| Plugin ID | kebab-case | `my-component-plugin` |
| Component ID | kebab-case | `my-component` |
| Java Class | PascalCase | `MyComponentPlugin` |
| React Component | PascalCase | `MyComponent.jsx` |
| Package | lowercase | `com.example.plugins` |

#### 3. **Version Management**

Follow Semantic Versioning (semver):

```
MAJOR.MINOR.PATCH

1.0.0 - Initial release
1.1.0 - Add new prop (backward compatible)
1.1.1 - Bug fix
2.0.0 - Breaking change (remove prop)
```

#### 4. **Error Handling**

```java
@Override
public void onLoad(PluginContext context) throws Exception {
    try {
        this.context = context;
        this.manifest = buildComponentManifest();
        log.info("Plugin loaded: {}", getPluginId());
    } catch (Exception e) {
        log.error("Failed to load plugin: {}", getPluginId(), e);
        throw new PluginLoadException("Load failed", e);
    }
}
```

#### 5. **Prop Validation**

```java
@Override
public ValidationResult validateProps(Map<String, Object> props) {
    List<String> errors = new ArrayList<>();

    // Required field check
    if (!props.containsKey("text") || props.get("text") == null) {
        errors.add("'text' is required");
    }

    // Type validation
    if (props.containsKey("count")) {
        try {
            Integer.parseInt(props.get("count").toString());
        } catch (NumberFormatException e) {
            errors.add("'count' must be a number");
        }
    }

    // Range validation
    if (props.containsKey("size")) {
        String size = props.get("size").toString();
        if (!List.of("small", "medium", "large").contains(size)) {
            errors.add("'size' must be one of: small, medium, large");
        }
    }

    return ValidationResult.builder()
            .isValid(errors.isEmpty())
            .errors(errors)
            .build();
}
```

#### 6. **React Component Best Practices**

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const MyComponent = ({
  text,
  color,
  size,
  onClick,
  styles
}) => {
  // State management
  const [isActive, setIsActive] = useState(false);

  // Memoized callbacks
  const handleClick = useCallback(() => {
    setIsActive(prev => !prev);
    onClick?.();
  }, [onClick]);

  // Cleanup
  useEffect(() => {
    return () => {
      // Cleanup logic
    };
  }, []);

  // Computed styles
  const componentStyles = {
    ...baseStyles,
    ...colorStyles[color],
    ...sizeStyles[size],
    ...styles, // User custom styles override
  };

  return (
    <div style={componentStyles} onClick={handleClick}>
      {text}
    </div>
  );
};

// Prop validation
MyComponent.propTypes = {
  text: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['red', 'blue', 'green']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
  styles: PropTypes.object,
};

// Default props
MyComponent.defaultProps = {
  color: 'blue',
  size: 'medium',
  styles: {},
};

export default MyComponent;
```

---

### Advanced Topics

#### 1. **Layout Components with Children**

```java
private ComponentManifest buildComponentManifest() {
    return ComponentManifest.builder()
            // ... other properties
            .canHaveChildren(true)  // Allow child components
            .acceptedChildTypes(List.of("ui", "layout"))  // Optional: restrict types
            .maxChildren(10)  // Optional: limit children
            .build();
}
```

React component with children:

```jsx
const Container = ({ children, layout, spacing, styles }) => {
  const layoutStyles = {
    grid: { display: 'grid', gap: spacing },
    flex: { display: 'flex', gap: spacing },
    stack: { display: 'flex', flexDirection: 'column', gap: spacing },
  };

  return (
    <div style={{ ...layoutStyles[layout], ...styles }}>
      {children}
    </div>
  );
};
```

#### 2. **Plugin Dependencies**

Declare dependencies in `plugin.yml`:

```yaml
plugin-id: advanced-component-plugin
version: 1.0.0
dependencies:
  - plugin-id: button-component-plugin
    version: ">=1.0.0"
  - plugin-id: container-layout-plugin
    version: "^2.0.0"
```

#### 3. **Custom Configuration**

```java
@Override
public void onLoad(PluginContext context) throws Exception {
    // Load configuration
    Properties config = context.getConfiguration();
    String apiKey = config.getProperty("api.key", "default-key");

    // Use configuration
    initializeService(apiKey);
}
```

Create `config/my-plugin.properties`:

```properties
api.key=your-api-key
api.endpoint=https://api.example.com
cache.enabled=true
cache.ttl=3600
```

#### 4. **Database Integration**

Use `@PluginEntity` for custom tables:

```java
@PluginEntity
@Entity
@Table(name = "my_plugin_data")
public class MyPluginData {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String key;
    private String value;

    // Getters and setters
}
```

#### 5. **Event System** (Planned Feature)

```java
@Override
public void onActivate(PluginContext context) throws Exception {
    // Subscribe to events
    context.getEventBus().subscribe("component.added", event -> {
        log.info("Component added: {}", event.getData());
    });
}
```

---

### Testing Guide

#### Unit Tests

```java
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class MyComponentPluginTest {

    @Test
    void testManifestGeneration() {
        MyComponentPlugin plugin = new MyComponentPlugin();
        ComponentManifest manifest = plugin.getComponentManifest();

        assertNotNull(manifest);
        assertEquals("my-component", manifest.getComponentId());
        assertEquals("ui", manifest.getCategory());
    }

    @Test
    void testPropValidation() {
        MyComponentPlugin plugin = new MyComponentPlugin();

        Map<String, Object> validProps = Map.of("text", "Hello");
        ValidationResult result = plugin.validateProps(validProps);
        assertTrue(result.isValid());

        Map<String, Object> invalidProps = Map.of();
        result = plugin.validateProps(invalidProps);
        assertFalse(result.isValid());
        assertTrue(result.getErrors().contains("'text' is required"));
    }
}
```

#### Integration Tests

```bash
# 1. Build plugin
mvn clean package

# 2. Copy to test environment
cp target/my-component-plugin-1.0.0.jar test-env/plugins/

# 3. Start test server
cd test-env
mvn spring-boot:run

# 4. Test API endpoints
curl http://localhost:8080/api/components/my-component-plugin/my-component

# 5. Test in builder UI
# Open http://localhost:5173/builder/new
# Verify component appears in palette
# Test drag-drop functionality
# Test property editing
```

#### React Component Testing

```jsx
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders with text prop', () => {
    render(<MyComponent text="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  test('handles click events', () => {
    const handleClick = jest.fn();
    render(<MyComponent text="Click me" onClick={handleClick} />);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom styles', () => {
    const customStyles = { backgroundColor: 'red' };
    const { container } = render(
      <MyComponent text="Styled" styles={customStyles} />
    );

    const element = container.firstChild;
    expect(element).toHaveStyle('background-color: red');
  });
});
```

---

### Plugin Examples

Check out these example plugins in the repository:

1. **button-component-plugin** - Basic UI component
   - Single interactive element
   - Multiple variants and sizes
   - Simple prop validation

2. **container-layout-plugin** - Layout component
   - Supports child components
   - Flexible layout modes
   - Dynamic sizing

3. **course-plugin** - Feature plugin
   - Custom entities and database tables
   - REST API endpoints
   - Complex business logic

---

## Plugin Management

### Install Plugin

**Method 1: Manual Installation**

```bash
# 1. Build plugin
cd plugins/my-component-plugin
mvn clean package

# 2. Copy JAR to plugins directory
cp target/my-component-plugin-1.0.0.jar ../../core/plugins/

# 3. Restart application
cd ../../core
mvn spring-boot:run
```

**Method 2: Hot Install (if backend is running)**

```bash
# Copy JAR to plugins directory
cp target/my-component-plugin-1.0.0.jar ../core/plugins/

# Plugin will be auto-detected on next startup
```

### Verify Installation

Check backend logs for:
```
INFO  - Loading plugin from JAR: my-component-plugin-1.0.0.jar
INFO  - Plugin manifest: My Component v1.0.0
INFO  - Instantiated plugin class: com.example.plugins.MyComponentPlugin
INFO  - Loading My Component Plugin
INFO  - Registered UI component: my-component from plugin: my-component-plugin
INFO  - Successfully loaded plugin: my-component-plugin
```

### Test Plugin via API

```bash
# List all components
curl http://localhost:8080/api/components

# Get specific component
curl http://localhost:8080/api/components/my-component-plugin/my-component

# Get component manifest
curl http://localhost:8080/api/components/my-component-plugin/my-component/manifest
```

### Use Plugin in Builder

1. Open builder: http://localhost:5173/builder/new
2. Find "My Component" in Component Palette (left sidebar)
3. Drag component onto canvas
4. Customize in Properties Panel (right sidebar):
   - Change text content
   - Select color variant
   - Edit CSS styles
   - Resize component

### Remove Plugin

**Method 1: Delete JAR**

```bash
# 1. Stop application
# 2. Delete plugin JAR
rm core/plugins/my-component-plugin-1.0.0.jar

# 3. Clean database (optional - removes all plugin data)
rm core/data/flashcarddb.mv.db

# 4. Restart application
cd core
mvn spring-boot:run
```

**Method 2: Deactivate (Future Feature)**

```bash
# Via API (not yet implemented)
curl -X POST http://localhost:8080/api/plugins/my-component-plugin/deactivate
```

### Export Plugin

```bash
# 1. Build plugin with dependencies
cd plugins/my-component-plugin
mvn clean package

# 2. Create distribution package
mkdir -p dist/my-component-plugin
cp target/my-component-plugin-1.0.0.jar dist/my-component-plugin/
cp README.md dist/my-component-plugin/
cp LICENSE dist/my-component-plugin/

# 3. Create archive
cd dist
zip -r my-component-plugin-1.0.0.zip my-component-plugin/

# Or tar
tar -czf my-component-plugin-1.0.0.tar.gz my-component-plugin/
```

**Distribution Package Structure**:
```
my-component-plugin-1.0.0.zip
├── my-component-plugin-1.0.0.jar
├── README.md
└── LICENSE
```

### Publish Plugin

**Option 1: GitHub Release**

```bash
# 1. Tag version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 2. Create GitHub Release
# - Go to GitHub repository
# - Navigate to Releases → Create new release
# - Upload my-component-plugin-1.0.0.zip
# - Add release notes
```

**Option 2: Maven Repository (Local)**

```xml
<!-- In plugin pom.xml, add distribution management -->
<distributionManagement>
    <repository>
        <id>local-repo</id>
        <url>file://${project.basedir}/../../repo</url>
    </repository>
</distributionManagement>
```

```bash
# Deploy to local repository
mvn clean deploy
```

**Option 3: Plugin Marketplace (Future Feature)**

```bash
# Via CLI (planned)
plugin-cli publish my-component-plugin-1.0.0.jar \
  --name "My Component" \
  --description "Custom UI component" \
  --category ui \
  --author "Your Name" \
  --license MIT
```

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (React)                    │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Component  │  │    Canvas    │  │ Properties │ │
│  │   Palette   │  │   (Builder)  │  │   Panel    │ │
│  └─────────────┘  └──────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────┘
                        ↕ REST API
┌─────────────────────────────────────────────────────┐
│             Backend (Spring Boot)                    │
│  ┌──────────────────────────────────────────────┐  │
│  │         ComponentRegistryController           │  │
│  │    GET /api/components                        │  │
│  │    GET /api/components/{plugin}/{component}   │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │         PluginManager                         │  │
│  │  - Scans plugins/ directory                   │  │
│  │  - Loads plugin JARs via ClassLoader          │  │
│  │  - Calls plugin lifecycle hooks               │  │
│  │  - Registers UI components                    │  │
│  └──────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────┐  │
│  │     ComponentRegistryService                  │  │
│  │  - Stores component metadata                  │  │
│  │  - Serves component manifests                 │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│                Plugin JARs                           │
│  ┌──────────────────────────────────────────────┐  │
│  │  button-component-plugin-1.0.0.jar            │  │
│  │  my-component-plugin-1.0.0.jar                │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Plugin Lifecycle

```
┌─────────────┐
│   JAR File  │
└──────┬──────┘
       │
       ↓
┌─────────────────────┐
│ PluginManager       │
│ 1. Scan directory   │
│ 2. Load plugin.yml  │
│ 3. Create ClassLoader
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Load Plugin Class   │
│ - Instantiate       │
│ - Call onLoad()     │
│ - Call onActivate() │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Register Component  │
│ - Get manifest      │
│ - Save to DB        │
│ - Make available    │
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│  Component Active   │
│  - In palette       │
│  - Drag-droppable   │
│  - Customizable     │
└─────────────────────┘
```

### Database Schema

**Key Tables**:
- `cms_plugins` - Plugin metadata
- `cms_component_registry` - UI component registry
- `cms_sites` - Site definitions
- `cms_pages` - Page definitions
- `cms_page_components` - Components on pages
- `cms_page_versions` - Version history

---

## API Reference

### Component Registry API

**Get All Components**
```http
GET /api/components
Response: 200 OK
[
  {
    "id": 1,
    "pluginId": "button-component-plugin",
    "componentId": "button",
    "componentName": "Button",
    "category": "ui",
    "icon": "🔘",
    "componentManifest": "{...}",
    "reactBundlePath": "/components/Button.jsx",
    "isActive": true,
    "registeredAt": "2025-12-16T01:00:58.268487"
  }
]
```

**Get Component by ID**
```http
GET /api/components/{pluginId}/{componentId}
Response: 200 OK
{
  "id": 1,
  "pluginId": "button-component-plugin",
  "componentId": "button",
  "componentName": "Button",
  ...
}
```

**Get Component Manifest**
```http
GET /api/components/{pluginId}/{componentId}/manifest
Response: 200 OK
{
  "componentId": "button",
  "displayName": "Button",
  "category": "ui",
  "defaultProps": {...},
  "configurableProps": [...],
  "configurableStyles": [...],
  "sizeConstraints": {...}
}
```

**Get Components by Category**
```http
GET /api/components/category/{category}
Response: 200 OK
[...]
```

**Get Plugin Components**
```http
GET /api/components/plugin/{pluginId}
Response: 200 OK
[...]
```

### Configuration Properties

```properties
# Server Configuration
server.port=8080

# Database
spring.datasource.url=jdbc:h2:file:./data/flashcarddb
spring.datasource.username=sa
spring.datasource.password=

# Plugin System
app.plugin.directory=plugins
app.plugin.hot-reload.enabled=true
app.plugin.validation.enabled=true

# File Upload
spring.servlet.multipart.max-file-size=1GB
spring.servlet.multipart.max-request-size=1GB
app.upload.dir=uploads

# Logging
logging.level.dev.mainul35=DEBUG
logging.level.org.springframework.web=INFO
```

---

## Troubleshooting

### Plugin Not Loading

**Check logs**:
```bash
# Look for errors in backend logs
tail -f core/logs/application.log

# Common issues:
# - plugin.yml not found
# - Main class not found
# - Missing dependencies
```

**Verify plugin structure**:
```bash
jar -tf my-component-plugin-1.0.0.jar | grep -E "(plugin.yml|components)"
```

### Component Not Appearing in Builder

1. Check component registered in database:
```bash
curl http://localhost:8080/api/components
```

2. Check browser console for errors
3. Verify React component path matches plugin.yml
4. Clear browser cache and reload

### Build Failures

```bash
# Clean Maven cache
mvn clean

# Rebuild SDK
cd flashcard-cms-plugin-sdk
mvn clean install -DskipTests

# Rebuild plugin
cd ../plugins/my-component-plugin
mvn clean package
```

### Database Issues

```bash
# Reset database
rm core/data/flashcarddb.mv.db
mvn spring-boot:run
```

---

## Contributing

See example plugin: `plugins/button-component-plugin/`

1. Fork the repository
2. Create feature branch
3. Develop your plugin
4. Test thoroughly
5. Submit pull request

---

## License

MIT License

---

## Contact

- **Author**: Mainul35
- **GitHub**: [Project Repository URL]
- **Issues**: [Issue Tracker URL]

---

**Happy Building! 🎨**
