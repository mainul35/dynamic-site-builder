# CRITICAL: Dimension Synchronization Rules

## GOLDEN RULE - DO NOT CHANGE

The following CSS classes MUST ALWAYS have synchronized (identical) width and height:

1. `.resizable-component.child-component`
2. `.resizable-content`
3. `.component-content`
4. `.draggable-component.child-component`

And for layout containers:
5. `.layout-placeholder`
6. `.children-container`

And for leaf components (Image, Label, etc.):
7. `.component-placeholder`
8. The renderer's container (e.g., ImageRenderer's outermost div)

## Component Hierarchy

```
.draggable-component.child-component
  └── .component-content
      └── .resizable-component.child-component
          └── .resizable-content
              └── .component-placeholder (for leaf) OR .layout-placeholder (for containers)
                  └── [Renderer Component] (e.g., ImageRenderer's div)
```

## Why This Matters

When a parent container is resized:
- The resized pixel dimensions are stored in `component.size.width` and `component.size.height`
- ALL wrapper elements must use `width: 100%` and `height: 100%` to inherit from the parent
- The topmost element (resizable-component) controls the actual pixel size
- All descendants fill that size via the 100% chain

## The Height Chain

```
Container with explicit height (e.g., 300px from resize)
  └── .draggable-component (height from inline styles)
      └── .component-content (height: 100%)
          └── .resizable-component (height from getContainerStyles())
              └── .resizable-content (height: 100%)
                  └── .layout-placeholder OR .component-placeholder (height: 100%)
                      └── .children-container (height: 100%) [for layouts]
                          └── Child components...
```

## Key Files

- `ResizableComponent.tsx` - Sets dimensions via `getContainerStyles()`
- `ResizableComponent.css` - CSS rules for resizable wrappers
- `DraggableComponent.tsx` - Sets dimensions via `getComponentStyles()`
- `DraggableComponent.css` - CSS rules for draggable wrappers
- `BuilderCanvas.tsx` - Wraps leaf components in `.component-placeholder` with `height: 100%`
- `BuilderCanvas.css` - CSS rules for placeholders and containers

## CRITICAL: Leaf Component Wrapper

Non-layout components (Image, Label, etc.) MUST be wrapped in a `.component-placeholder` div
with `width: 100%` and `height: 100%` inline styles. This happens in `BuilderCanvas.tsx`
in the `renderComponent()` function. Without this wrapper, the height chain breaks and
leaf components won't follow their parent container's resize.

## NEVER DO

1. Never set `height: auto` on any of these wrapper elements when the parent has explicit dimensions
2. Never use `fit-content` for height on containers that need to fill their parent
3. Never add min-height constraints larger than 40px that would prevent shrinking
4. Never calculate min-size based on children's rendered dimensions (causes circular dependency)

## ALWAYS DO

1. Use `height: 100%` for all wrapper elements to inherit from parent
2. Use `width: 100%` for wrapper elements (except when explicit width is set)
3. Keep min-height at 40px to allow resizing to small sizes
4. Ensure the Image component uses `height: 100%` when inside a parent container
5. Use `align-self: stretch` for Image child components (overrides `flex-start`)
6. Use `min-width: 0` on ALL wrapper elements to allow shrinking below content width

## CRITICAL: Image Component CSS

Image components have special CSS rules in `DraggableComponent.css` that override the
default `align-self: flex-start` from `.child-component`. This is necessary because:

- `.child-component` uses `align-self: flex-start` to prevent stretching
- But Images need to stretch to fill their parent Container
- The Image CSS selector `[data-component-id^="Image-"]` sets `align-self: stretch`
- All Image wrapper elements use `width: 100%` and `height: 100%`

Without `align-self: stretch`, the Image won't fill the parent's height even with `height: 100%`.

## CRITICAL: Resize Must Update Both Wrappers

During resize operations, BOTH `.draggable-component` AND `.resizable-component` must be updated:

- `.draggable-component` controls the **width** in the flex/grid layout
- `.resizable-component` controls the **height** (and inner dimensions)

The `ResizableComponent.tsx` `handleResizeMove()` function must update both elements:

```typescript
// Update resizable-component
componentRef.current.style.width = `${newWidth}px`;
componentRef.current.style.height = `${newHeight}px`;

// ALSO update the parent draggable-component
const draggableWrapper = componentRef.current.closest('.draggable-component');
if (draggableWrapper) {
  draggableWrapper.style.width = `${newWidth}px`;
  draggableWrapper.style.height = `${newHeight}px`;
}
```

Without updating both, width resize won't work because the outer wrapper constrains the inner.

---

## IMAGE COMPONENT SIZING

### Current Implementation (Updated 2026-01-17)

Image components have special behavior compared to other leaf components:

1. **Always fill parent**: ImageRenderer uses `width: '100%'` and `height: '100%'` on its container
2. **Free resizing**: Images can be resized freely without minimum content constraints
3. **Source change handling**: Loading/error state resets when src changes via `useEffect`

### ImageRenderer Container Styles

The ImageRenderer always uses `width: '100%'` and `height: '100%'` at the END of containerStyles to ensure the image fills its parent wrapper:

```typescript
const containerStyles: React.CSSProperties = {
  maxWidth: hasParent ? undefined : '100%',
  position: 'relative',
  overflow: 'hidden',
  boxSizing: 'border-box',
  ...(component.styles as React.CSSProperties),
  height: '100%',  // MUST be last to override any stored values
  width: '100%'    // MUST be last to override any stored values
};
```

### ResizableComponent Special Handling for Images

Images are exempted from content-based minimum size constraints in `ResizableComponent.tsx`:

```typescript
const getMinSizeFromChildren = (): { childMinWidth: number; childMinHeight: number } => {
  // ...
  if (!childrenContainer) {
    // Check if this is an Image component - Images should be freely resizable
    const isImageComponent = component.componentId.startsWith('Image');
    if (isImageComponent) {
      // Images can be resized freely - use default minimums only (40px)
      return { childMinWidth: minWidth, childMinHeight: minHeight };
    }
    // Other leaf components measure content for minimum size...
  }
};
```

This allows Images to be resized to any size down to 40x40px, unlike Labels/Buttons which have text content that constrains their minimum size.

### Image Source Change Handling

When the image URL changes (e.g., from the image picker), the component resets its loading state:

```typescript
// Reset loading/error state when src changes
useEffect(() => {
  setIsLoaded(false);
  setHasError(false);
}, [src]);
```

This ensures that:

- A previously failed image doesn't stay in error state when a new URL is set
- The loading placeholder shows while the new image loads

### Key Files for Image Sizing

| File | Purpose |
|------|---------|
| `ImageRenderer.tsx` | Sets `width: '100%'` and `height: '100%'` on container div |
| `DraggableComponent.css` | Special CSS for `[data-component-id^="Image-"]` with `align-self: stretch` |
| `ResizableComponent.tsx` | Exempts Images from content-based minimum size constraints |

### Plugin Build Process

After modifying ImageRenderer.tsx, you MUST rebuild the plugin bundle:

```bash
# 1. Build the frontend bundle
cd plugins/image-component-plugin/frontend
npm run build

# 2. Package the Maven JAR (includes bundle.js)
cd ..
mvn clean package -DskipTests

# 3. Copy to core plugins (for runtime)
cp target/image-component-plugin-1.0.0.jar ../core/plugins/
cp target/image-component-plugin-1.0.0.jar ../core/target/plugins/

# 4. Restart Spring Boot application to reload plugin
```

The browser loads `bundle.js` from the JAR, NOT the source TypeScript. If changes don't appear:
- Verify bundle was rebuilt (`npm run build`)
- Verify JAR was rebuilt (`mvn package`)
- Verify JAR was copied to `core/plugins/` AND `core/target/plugins/`
- Restart the Spring Boot application
- Hard refresh browser (Ctrl+Shift+R)

---

## Last Updated

2026-01-17 - Updated Image component documentation:

- ImageRenderer always uses `width: '100%'` and `height: '100%'`
- ResizableComponent exempts Images from content-based minimum constraints
- Added useEffect to reset loading/error state when src changes
