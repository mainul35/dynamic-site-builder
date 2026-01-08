package dev.mainul35.plugins.ui;

import dev.mainul35.cms.sdk.AbstractUIComponentPlugin;
import dev.mainul35.cms.sdk.annotation.UIComponent;
import dev.mainul35.cms.sdk.component.PropDefinition;
import dev.mainul35.cms.sdk.component.StyleDefinition;

import java.util.List;

@UIComponent(
    componentId = "TestComponent",
    displayName = "TestComponent",
    category = "ui",
    icon = "□",
    description = "A custom TestComponent component",
    defaultWidth = "200px",
    defaultHeight = "100px",
    resizable = true
)
public class TestComponentComponentPlugin extends AbstractUIComponentPlugin {

    @Override
    protected List<PropDefinition> defineProps() {
        return List.of(
            prop("text", "Text", "Hello Hasan San")
        );
    }

    @Override
    protected List<StyleDefinition> defineStyles() {
        return List.of(
            colorStyle("backgroundColor", "#ffffff"),
            colorStyle("color", "#333333"),
            sizeStyle("padding", "16px")
        );
    }
}
