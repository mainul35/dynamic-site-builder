package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.AbstractUIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.PropDefinition;
import dev.mainul35.cms.sdk.component.StyleDefinition;

import java.util.List;

/**
 * Horizontal Row Component Plugin
 * Provides a horizontal divider/separator line for visual layouts.
 *
 * This plugin demonstrates the simplified plugin development using AbstractUIComponentPlugin.
 */
@UIComponent(
    componentId = "HorizontalRow",
    displayName = "Horizontal Row",
    category = "ui",
    icon = "━",
    description = "A horizontal divider/separator line",
    defaultWidth = "100%",
    defaultHeight = "20px",
    minHeight = "1px",
    maxHeight = "50px",
    resizable = true
)
public class HorizontalRowComponentPlugin extends AbstractUIComponentPlugin {

    @Override
    protected List<PropDefinition> defineProps() {
        return List.of(
            selectProp("thickness", "2px", List.of("1px", "2px", "3px", "4px", "5px")),
            selectProp("lineStyle", "solid", List.of("solid", "dashed", "dotted", "double")),
            selectProp("width", "100%", List.of("25%", "50%", "75%", "100%")),
            selectProp("alignment", "center", List.of("left", "center", "right"))
        );
    }

    @Override
    protected List<StyleDefinition> defineStyles() {
        return List.of(
            colorStyle("color", "#e0e0e0"),
            sizeStyle("marginTop", "16px"),
            sizeStyle("marginBottom", "16px")
        );
    }
}
