/**
 * Event System for Dynamic Site Builder
 *
 * This module provides a flexible event handling system that allows:
 * - Plugin developers to register custom event handlers
 * - Users to configure events via UI (simple actions) or code editor (advanced)
 * - Cross-component communication via global event bus
 *
 * @example Plugin developer registering a handler:
 * ```typescript
 * import { registerEventHandler } from './events';
 *
 * registerEventHandler('CustomButton', 'onClick', (ctx) => {
 *   ctx.emit('buttonClicked', { id: ctx.component.instanceId });
 * }, 'my-plugin');
 * ```
 *
 * @example Using events in a renderer:
 * ```typescript
 * import { useComponentEvents } from './events';
 *
 * const MyRenderer: React.FC<RendererProps> = ({ component, isEditMode }) => {
 *   const events = useComponentEvents(component, { isEditMode });
 *   return <button {...events}>{component.props.text}</button>;
 * };
 * ```
 */

// Core registry
export {
  EventRegistry,
  EventRegistryClass,
  type EventContext,
  type EventHandler,
  type EventConfig,
  type EventAction,
  type EventType,
  type UIEventType,
  type CustomEventType,
  ActionType,
} from './EventRegistry';

// Hook and utilities
export {
  useComponentEvents,
  registerEventHandler,
  subscribeToEvent,
  type ComponentEventHandlers,
} from './useComponentEvents';
