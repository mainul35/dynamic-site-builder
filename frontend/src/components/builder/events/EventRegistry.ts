import { ComponentInstance } from '../../../types/builder';

/**
 * Standard UI event types supported by the system
 */
export type UIEventType =
  | 'onClick'
  | 'onDoubleClick'
  | 'onMouseEnter'
  | 'onMouseLeave'
  | 'onFocus'
  | 'onBlur'
  | 'onChange'
  | 'onInput'
  | 'onSubmit'
  | 'onKeyDown'
  | 'onKeyUp'
  | 'onKeyPress';

/**
 * Custom event types that can be defined by plugins
 */
export type CustomEventType = string;

/**
 * All supported event types
 */
export type EventType = UIEventType | CustomEventType;

/**
 * Context passed to event handlers
 */
export interface EventContext {
  /** The component instance that triggered the event */
  component: ComponentInstance;
  /** The original DOM event (if applicable) */
  originalEvent?: Event | React.SyntheticEvent;
  /** Whether the builder is in edit mode */
  isEditMode: boolean;
  /** Custom data passed with the event */
  data?: Record<string, any>;
  /** Utility to update component props */
  updateProps: (props: Record<string, any>) => void;
  /** Utility to update component styles */
  updateStyles: (styles: Record<string, string>) => void;
  /** Utility to emit a custom event */
  emit: (eventType: string, data?: any) => void;
  /** Utility to navigate (if navigation action) */
  navigate?: (path: string) => void;
}

/**
 * Event handler function signature
 */
export type EventHandler = (context: EventContext) => void | Promise<void>;

/**
 * Built-in action types for simple UI configuration
 */
export enum ActionType {
  /** No action */
  NONE = 'none',
  /** Navigate to a URL or page */
  NAVIGATE = 'navigate',
  /** Show an alert/toast message */
  SHOW_MESSAGE = 'showMessage',
  /** Toggle visibility of another component */
  TOGGLE_VISIBILITY = 'toggleVisibility',
  /** Update a prop on another component */
  UPDATE_PROP = 'updateProp',
  /** Submit a form */
  SUBMIT_FORM = 'submitForm',
  /** Open a modal/dialog */
  OPEN_MODAL = 'openModal',
  /** Close a modal/dialog */
  CLOSE_MODAL = 'closeModal',
  /** Execute custom code */
  CUSTOM_CODE = 'customCode',
  /** Call an API endpoint */
  CALL_API = 'callApi',
  /** Emit a custom event */
  EMIT_EVENT = 'emitEvent',
}

/**
 * Event action configuration (for UI-based configuration)
 */
export interface EventAction {
  /** The type of action to perform */
  type: ActionType;
  /** Action-specific configuration */
  config: Record<string, any>;
}

/**
 * Event configuration stored on a component
 */
export interface EventConfig {
  /** The event type (e.g., 'onClick', 'onHover') */
  eventType: EventType;
  /** Simple action (UI configured) */
  action?: EventAction;
  /** Custom code (code editor) */
  customCode?: string;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
  /** Only execute in preview mode (not edit mode) */
  previewOnly?: boolean;
}

/**
 * Event handler registration entry
 */
interface HandlerRegistration {
  handler: EventHandler;
  pluginId?: string;
  priority: number;
}

/**
 * EventRegistry - Central registry for component event handlers
 *
 * This registry allows:
 * 1. Plugins to register custom event handlers for their components
 * 2. Built-in action handlers for common operations
 * 3. Custom code execution for advanced use cases
 *
 * Plugin developers use this to register event handlers without
 * modifying the core framework code.
 */
class EventRegistryClass {
  /** Handlers registered per component type and event */
  private handlers: Map<string, HandlerRegistration[]> = new Map();

  /** Global event listeners (cross-component event bus) */
  private globalListeners: Map<string, Set<EventHandler>> = new Map();

  /** Built-in action handlers */
  private actionHandlers: Map<ActionType, EventHandler> = new Map();

  constructor() {
    this.initializeBuiltInActions();
  }

  /**
   * Initialize built-in action handlers
   */
  private initializeBuiltInActions(): void {
    // Navigate action
    this.actionHandlers.set(ActionType.NAVIGATE, (ctx) => {
      const url = ctx.data?.url || ctx.component.props?.href;
      if (url && ctx.navigate) {
        ctx.navigate(url);
      } else if (url) {
        window.location.href = url;
      }
    });

    // Show message action
    this.actionHandlers.set(ActionType.SHOW_MESSAGE, (ctx) => {
      const message = ctx.data?.message || 'Action triggered';
      const type = ctx.data?.type || 'info';
      // In a real app, this would use a toast/notification system
      console.log(`[${type}] ${message}`);
      alert(message); // Fallback for now
    });

    // Update prop action
    this.actionHandlers.set(ActionType.UPDATE_PROP, (ctx) => {
      const { propName, value } = ctx.data || {};
      if (propName !== undefined) {
        ctx.updateProps({ [propName]: value });
      }
    });

    // Emit event action
    this.actionHandlers.set(ActionType.EMIT_EVENT, (ctx) => {
      const { eventName, eventData } = ctx.data || {};
      if (eventName) {
        ctx.emit(eventName, eventData);
      }
    });

    // Custom code action (executed via eval - should be sandboxed in production)
    this.actionHandlers.set(ActionType.CUSTOM_CODE, (ctx) => {
      const code = ctx.data?.code;
      if (code) {
        try {
          // Create a safe context for the custom code
          const safeContext = {
            component: ctx.component,
            props: ctx.component.props,
            styles: ctx.component.styles,
            updateProps: ctx.updateProps,
            updateStyles: ctx.updateStyles,
            emit: ctx.emit,
            event: ctx.originalEvent,
            console: console,
          };

          // Execute the code with the context
          const fn = new Function(...Object.keys(safeContext), code);
          fn(...Object.values(safeContext));
        } catch (error) {
          console.error('[EventRegistry] Custom code execution error:', error);
        }
      }
    });

    // Call backend API action - invokes backend event handlers
    this.actionHandlers.set(ActionType.CALL_API, async (ctx) => {
      // Dynamic import to avoid circular dependency
      const { eventService } = await import('../../../services/eventService');

      const eventData = ctx.data || {};

      try {
        const response = await eventService.invokeBackendHandler(
          ctx.component,
          ctx.data?.eventType || 'onAction',
          eventData
        );

        // Process response commands
        eventService.processCommands(response, {
          navigate: ctx.navigate,
          showMessage: (message, type) => {
            // Use browser alert as fallback - in production, use a toast library
            if (type === 'error') {
              console.error(message);
            } else {
              console.log(`[${type}] ${message}`);
            }
            alert(message);
          },
          updateProps: ctx.updateProps,
          updateStyles: ctx.updateStyles,
        });

        // If backend returned errors, log them
        if (response.status === 'failure') {
          console.error('[EventRegistry] Backend handler failed:', response.message);
        }

        // Emit success/failure event
        ctx.emit(
          response.status === 'success' ? 'backendHandlerSuccess' : 'backendHandlerError',
          { response, component: ctx.component }
        );
      } catch (error) {
        console.error('[EventRegistry] CALL_API error:', error);
        ctx.emit('backendHandlerError', { error, component: ctx.component });
      }
    });
  }

  /**
   * Register an event handler for a component type
   *
   * @param componentId - The component ID (e.g., "Button")
   * @param eventType - The event type (e.g., "onClick")
   * @param handler - The event handler function
   * @param pluginId - Optional plugin ID for plugin-specific handlers
   * @param priority - Handler priority (higher = runs first), default 0
   */
  register(
    componentId: string,
    eventType: EventType,
    handler: EventHandler,
    pluginId?: string,
    priority: number = 0
  ): void {
    const key = this.buildKey(componentId, eventType, pluginId);

    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }

    this.handlers.get(key)!.push({ handler, pluginId, priority });

    // Sort by priority (descending)
    this.handlers.get(key)!.sort((a, b) => b.priority - a.priority);

    console.log(`[EventRegistry] Registered handler: ${key}`);
  }

  /**
   * Unregister an event handler
   */
  unregister(componentId: string, eventType: EventType, pluginId?: string): void {
    const key = this.buildKey(componentId, eventType, pluginId);
    this.handlers.delete(key);
    console.log(`[EventRegistry] Unregistered handler: ${key}`);
  }

  /**
   * Get handlers for a component event
   */
  getHandlers(componentId: string, eventType: EventType, pluginId?: string): EventHandler[] {
    // Try plugin-specific handler first
    if (pluginId) {
      const pluginKey = this.buildKey(componentId, eventType, pluginId);
      const pluginHandlers = this.handlers.get(pluginKey);
      if (pluginHandlers && pluginHandlers.length > 0) {
        return pluginHandlers.map((h) => h.handler);
      }
    }

    // Fall back to generic handler
    const genericKey = this.buildKey(componentId, eventType);
    const genericHandlers = this.handlers.get(genericKey);
    return genericHandlers ? genericHandlers.map((h) => h.handler) : [];
  }

  /**
   * Execute an event with the configured action or handlers
   */
  async executeEvent(
    eventConfig: EventConfig,
    context: Omit<EventContext, 'emit'>
  ): Promise<void> {
    // Don't execute in edit mode if previewOnly is set
    if (eventConfig.previewOnly && context.isEditMode) {
      return;
    }

    // Add emit function to context
    const fullContext: EventContext = {
      ...context,
      emit: (eventType: string, data?: any) => {
        this.emitGlobal(eventType, { ...context, data, emit: () => {} } as EventContext);
      },
    };

    // Handle preventDefault and stopPropagation
    if (context.originalEvent) {
      if (eventConfig.preventDefault) {
        context.originalEvent.preventDefault?.();
      }
      if (eventConfig.stopPropagation) {
        context.originalEvent.stopPropagation?.();
      }
    }

    // Execute based on configuration
    if (eventConfig.customCode) {
      // Execute custom code
      const customCodeHandler = this.actionHandlers.get(ActionType.CUSTOM_CODE);
      if (customCodeHandler) {
        await customCodeHandler({ ...fullContext, data: { code: eventConfig.customCode } });
      }
    } else if (eventConfig.action) {
      // Execute configured action
      const actionHandler = this.actionHandlers.get(eventConfig.action.type);
      if (actionHandler) {
        await actionHandler({ ...fullContext, data: eventConfig.action.config });
      }
    }

    // Also execute any registered handlers for this event
    const handlers = this.getHandlers(
      context.component.componentId,
      eventConfig.eventType,
      context.component.pluginId
    );

    for (const handler of handlers) {
      try {
        await handler(fullContext);
      } catch (error) {
        console.error(`[EventRegistry] Handler error for ${eventConfig.eventType}:`, error);
      }
    }
  }

  /**
   * Subscribe to global events (event bus)
   */
  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.globalListeners.has(eventType)) {
      this.globalListeners.set(eventType, new Set());
    }

    this.globalListeners.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.globalListeners.get(eventType)?.delete(handler);
    };
  }

  /**
   * Emit a global event
   */
  emitGlobal(eventType: string, context: EventContext): void {
    const listeners = this.globalListeners.get(eventType);
    if (listeners) {
      listeners.forEach((handler) => {
        try {
          handler(context);
        } catch (error) {
          console.error(`[EventRegistry] Global event error for ${eventType}:`, error);
        }
      });
    }
  }

  /**
   * Register a custom action handler
   */
  registerActionHandler(actionType: ActionType | string, handler: EventHandler): void {
    this.actionHandlers.set(actionType as ActionType, handler);
  }

  /**
   * Get all registered handler keys (for debugging)
   */
  getRegisteredKeys(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Clear all registered handlers
   */
  clear(): void {
    this.handlers.clear();
    this.globalListeners.clear();
  }

  /**
   * Build a registry key
   */
  private buildKey(componentId: string, eventType: EventType, pluginId?: string): string {
    return pluginId ? `${pluginId}:${componentId}:${eventType}` : `${componentId}:${eventType}`;
  }
}

// Export singleton instance
export const EventRegistry = new EventRegistryClass();

// Export the class for testing
export { EventRegistryClass };
