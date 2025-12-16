# Button Component Plugin

A customizable button UI component for the Visual Site Builder.

## Overview

This plugin provides a fully-featured button component with multiple variants, sizes, and customization options.

## Features

- **5 Color Variants**: primary, secondary, success, danger, warning
- **3 Size Options**: small, medium, large
- **Customizable**: Text, disabled state, full width option
- **Responsive**: Hover effects and transitions
- **Accessible**: Proper disabled states and cursor handling

## Properties

| Property | Type | Default | Options | Description |
|----------|------|---------|---------|-------------|
| text | String | "Click Me" | - | Button text content |
| variant | Select | "primary" | primary, secondary, success, danger, warning | Button color scheme |
| size | Select | "medium" | small, medium, large | Button size |
| disabled | Boolean | false | - | Disable the button |
| fullWidth | Boolean | false | - | Make button full width |

## Styles

| Style | Type | Default | Description |
|-------|------|---------|-------------|
| borderRadius | Size | 6px | Corner radius |
| fontWeight | Select | 500 | Font weight (400-700) |

## Installation

1. **Build the plugin**:
   ```bash
   cd plugins/button-component-plugin
   mvn clean package
   ```

2. **Deploy the plugin**:
   - Copy the generated JAR from `target/button-component-plugin-1.0.0.jar`
   - Place it in the `plugins/` directory of your application
   - Restart the application

3. **Use in Builder**:
   - Open the Visual Site Builder
   - Find "Button" in the Component Palette under "UI" category
   - Drag and drop onto the canvas
   - Customize properties in the Properties Panel

## Development

### Build
```bash
mvn clean package
```

### Test
```bash
mvn test
```

### Debug
Enable debug logging in `application.properties`:
```properties
logging.level.dev.mainul35.plugins=DEBUG
```

## Architecture

### Plugin Structure
```
button-component-plugin/
├── pom.xml
├── src/
│   └── main/
│       ├── java/
│       │   └── dev/mainul35/plugins/ui/
│       │       └── ButtonComponentPlugin.java
│       └── resources/
│           ├── plugin.yml
│           └── components/
│               └── Button.jsx
```

### Plugin Class
- Implements `UIComponentPlugin` interface
- Uses `@UIComponent` annotation
- Defines component manifest with props and styles
- Validates user input

### React Component
- Pure functional component
- Accepts props from builder
- Applies custom styles
- Handles hover states

## Version History

### 1.0.0 (2025-12-16)
- Initial release
- Basic button with 5 variants
- 3 size options
- Full customization support

## License

MIT License

## Author

Mainul35
