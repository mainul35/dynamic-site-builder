import { useCallback, useMemo } from 'react';
import { ComponentInstance } from '../../../types/builder';
import { useBuilderStore } from '../../../stores/builderStore';
import {
  EventRegistry,
  EventConfig,
  EventContext,
  EventType,
  UIEventType,
} from './EventRegistry';

/**
 * Hook return type with all event handlers
 */
export interface ComponentEventHandlers {
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  onMouseEnter: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onFocus: (e: React.FocusEvent) => void;
  onBlur: (e: React.FocusEvent) => void;
  onChange: (e: React.ChangeEvent) => void;
  onInput: (e: React.FormEvent) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onKeyUp: (e: React.KeyboardEvent) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

/**
 * Options for the useComponentEvents hook
 */
interface UseComponentEventsOptions {
  /** Whether the component is in edit mode */
  isEditMode: boolean;
  /** Custom navigation function */
  navigate?: (path: string) => void;
  /** Additional event handlers to merge */
  additionalHandlers?: Partial<ComponentEventHandlers>;
}

/**
 * Hook to create event handlers for a component based on its event configuration
 *
 * This hook:
 * 1. Reads event configurations from component.events
 * 2. Creates handlers that execute configured actions
 * 3. Integrates with the EventRegistry for custom handlers
 * 4. Provides props/styles update functions
 *
 * @example
 * ```tsx
 * const MyRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
 *   const eventHandlers = useComponentEvents(component, { isEditMode });
 *
 *   return (
 *     <button {...eventHandlers}>
 *       {component.props.text}
 *     </button>
 *   );
 * };
 * ```
 */
export function useComponentEvents(
  component: ComponentInstance,
  options: UseComponentEventsOptions
): ComponentEventHandlers {
  const { isEditMode, navigate, additionalHandlers } = options;

  const { updateComponentProps, updateComponentStyles } = useBuilderStore();

  // Get event configurations from component
  const eventConfigs: EventConfig[] = useMemo(() => {
    return (component as any).events || [];
  }, [component]);

  // Create update functions for the event context
  const updateProps = useCallback(
    (props: Record<string, any>) => {
      updateComponentProps(component.instanceId, {
        ...component.props,
        ...props,
      });
    },
    [component.instanceId, component.props, updateComponentProps]
  );

  const updateStyles = useCallback(
    (styles: Record<string, string>) => {
      updateComponentStyles(component.instanceId, {
        ...component.styles,
        ...styles,
      });
    },
    [component.instanceId, component.styles, updateComponentStyles]
  );

  // Create a handler for a specific event type
  const createHandler = useCallback(
    (eventType: UIEventType) => {
      return (e: React.SyntheticEvent) => {
        // In edit mode, only allow certain events and don't execute actions
        if (isEditMode) {
          // Allow hover events for visual feedback
          if (eventType !== 'onMouseEnter' && eventType !== 'onMouseLeave') {
            e.stopPropagation();
            return;
          }
        }

        // Find event config for this event type
        const eventConfig = eventConfigs.find((cfg) => cfg.eventType === eventType);

        // Build event context
        const context: Omit<EventContext, 'emit'> = {
          component,
          originalEvent: e,
          isEditMode,
          updateProps,
          updateStyles,
          navigate,
        };

        // Execute the event if configured
        if (eventConfig) {
          EventRegistry.executeEvent(eventConfig, context);
        }

        // Also check for registered handlers (even without config)
        const handlers = EventRegistry.getHandlers(
          component.componentId,
          eventType,
          component.pluginId
        );

        if (handlers.length > 0 && !eventConfig) {
          // Execute handlers directly if no config but handlers are registered
          const fullContext: EventContext = {
            ...context,
            emit: (eventName: string, data?: any) => {
              EventRegistry.emitGlobal(eventName, { ...context, data } as EventContext);
            },
          };

          handlers.forEach((handler) => {
            try {
              handler(fullContext);
            } catch (error) {
              console.error(`[useComponentEvents] Handler error:`, error);
            }
          });
        }

        // Call additional handler if provided
        const additionalHandler = additionalHandlers?.[eventType as keyof ComponentEventHandlers];
        if (additionalHandler) {
          (additionalHandler as (e: React.SyntheticEvent) => void)(e);
        }
      };
    },
    [
      component,
      eventConfigs,
      isEditMode,
      updateProps,
      updateStyles,
      navigate,
      additionalHandlers,
    ]
  );

  // Create all event handlers
  const handlers = useMemo<ComponentEventHandlers>(
    () => ({
      onClick: createHandler('onClick') as (e: React.MouseEvent) => void,
      onDoubleClick: createHandler('onDoubleClick') as (e: React.MouseEvent) => void,
      onMouseEnter: createHandler('onMouseEnter') as (e: React.MouseEvent) => void,
      onMouseLeave: createHandler('onMouseLeave') as (e: React.MouseEvent) => void,
      onFocus: createHandler('onFocus') as (e: React.FocusEvent) => void,
      onBlur: createHandler('onBlur') as (e: React.FocusEvent) => void,
      onChange: createHandler('onChange') as (e: React.ChangeEvent) => void,
      onInput: createHandler('onInput') as (e: React.FormEvent) => void,
      onSubmit: createHandler('onSubmit') as (e: React.FormEvent) => void,
      onKeyDown: createHandler('onKeyDown') as (e: React.KeyboardEvent) => void,
      onKeyUp: createHandler('onKeyUp') as (e: React.KeyboardEvent) => void,
      onKeyPress: createHandler('onKeyPress') as (e: React.KeyboardEvent) => void,
    }),
    [createHandler]
  );

  return handlers;
}

/**
 * Register a plugin's event handler
 *
 * Plugin developers use this to register custom event handlers
 * for their components.
 *
 * @example
 * ```typescript
 * // In your plugin's initialization
 * registerEventHandler('MyButton', 'onClick', (ctx) => {
 *   console.log('MyButton clicked!', ctx.component.props);
 *   ctx.emit('myButtonClicked', { timestamp: Date.now() });
 * }, 'my-plugin');
 * ```
 */
export function registerEventHandler(
  componentId: string,
  eventType: EventType,
  handler: (context: EventContext) => void | Promise<void>,
  pluginId?: string,
  priority: number = 0
): void {
  EventRegistry.register(componentId, eventType, handler, pluginId, priority);
}

/**
 * Subscribe to global events
 *
 * Components can emit custom events that other components can listen to.
 *
 * @example
 * ```typescript
 * // Subscribe to a custom event
 * const unsubscribe = subscribeToEvent('cartUpdated', (ctx) => {
 *   console.log('Cart was updated:', ctx.data);
 * });
 *
 * // Later, unsubscribe
 * unsubscribe();
 * ```
 */
export function subscribeToEvent(
  eventType: string,
  handler: (context: EventContext) => void
): () => void {
  return EventRegistry.subscribe(eventType, handler);
}

export default useComponentEvents;
