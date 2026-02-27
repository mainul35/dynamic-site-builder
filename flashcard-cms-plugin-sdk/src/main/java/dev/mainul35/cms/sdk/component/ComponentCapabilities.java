package dev.mainul35.cms.sdk.component;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Defines behavioral capabilities of a UI component in the visual builder.
 * Used by the frontend to determine drag-drop behavior, container support,
 * data binding, and resizing constraints.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentCapabilities {

    /**
     * Whether this component can contain child components.
     */
    @Builder.Default
    private boolean canHaveChildren = false;

    /**
     * Whether this component supports data source bindings.
     */
    @Builder.Default
    private boolean hasDataSource = false;

    /**
     * Whether this component should auto-size its height to fit content.
     */
    @Builder.Default
    private boolean autoHeight = false;

    /**
     * Whether this component acts as a layout container (accepts drops).
     */
    @Builder.Default
    private boolean isContainer = false;

    /**
     * Whether this component supports iteration over data collections.
     */
    @Builder.Default
    private boolean supportsIteration = false;

    /**
     * Whether this component can be resized by the user in the builder.
     */
    @Builder.Default
    private boolean isResizable = true;

    /**
     * Whether this component supports template data bindings (e.g., {{variable}}).
     */
    @Builder.Default
    private boolean supportsTemplateBindings = true;
}
