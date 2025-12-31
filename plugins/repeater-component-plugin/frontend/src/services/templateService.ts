/**
 * Template Service - Resolves {{variable}} syntax in component props
 */

import type { DataContext } from '../types';

/**
 * Variable pattern: {{variable.path}} or {{variable.path | filter}}
 */
const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

/**
 * Parse a variable path into segments
 */
function parseVariablePath(pathStr: string): string[] {
  const segments: string[] = [];
  let current = '';
  let i = 0;

  while (i < pathStr.length) {
    const char = pathStr[i];

    if (char === '.') {
      if (current) {
        segments.push(current);
        current = '';
      }
      i++;
    } else if (char === '[') {
      if (current) {
        segments.push(current);
        current = '';
      }
      const closeBracket = pathStr.indexOf(']', i);
      if (closeBracket === -1) {
        throw new Error(`Unclosed bracket in path: ${pathStr}`);
      }
      let indexPart = pathStr.slice(i + 1, closeBracket);
      if ((indexPart.startsWith("'") && indexPart.endsWith("'")) ||
          (indexPart.startsWith('"') && indexPart.endsWith('"'))) {
        indexPart = indexPart.slice(1, -1);
      }
      segments.push(indexPart);
      i = closeBracket + 1;
    } else {
      current += char;
      i++;
    }
  }

  if (current) {
    segments.push(current);
  }

  return segments;
}

/**
 * Get a value from an object by path
 */
function getValueByPath(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;

  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      current = current[parseInt(segment, 10)];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Resolve a single variable from context
 */
function resolveVariable(path: string[], context: DataContext): unknown {
  if (path.length === 0) {
    return undefined;
  }

  const rootKey = path[0];
  let value: unknown;

  switch (rootKey) {
    case 'item':
      value = context.item;
      if (path.length > 1) {
        value = getValueByPath(value, path.slice(1));
      }
      break;
    case 'index':
      value = context.index;
      break;
    default:
      if (context.dataSources && rootKey in context.dataSources) {
        value = context.dataSources[rootKey];
        if (path.length > 1) {
          value = getValueByPath(value, path.slice(1));
        }
      } else if (context.item && typeof context.item === 'object') {
        value = getValueByPath(context.item, path);
      } else {
        value = getValueByPath(context.dataSources, path) ??
                getValueByPath(context.sharedData, path) ??
                getValueByPath(context.item, path);
      }
  }

  return value;
}

/**
 * Resolve a template string with context
 */
export function resolveTemplate(template: string, context: DataContext): string {
  if (typeof template !== 'string') {
    return String(template);
  }

  return template.replace(VARIABLE_PATTERN, (_match, expression) => {
    const trimmedExpr = expression.trim();
    const pathPart = trimmedExpr.split('|')[0].trim();
    const path = parseVariablePath(pathPart);
    const value = resolveVariable(path, context);

    if (value === undefined || value === null) {
      return '';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

/**
 * Resolve template variables in component props
 */
export function resolveTemplateVariables(
  props: Record<string, unknown>,
  context: DataContext
): Record<string, unknown> {
  const resolved: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === 'string' && value.includes('{{')) {
      resolved[key] = resolveTemplate(value, context);
    } else if (Array.isArray(value)) {
      resolved[key] = value.map((item) => {
        if (typeof item === 'string' && item.includes('{{')) {
          return resolveTemplate(item, context);
        }
        if (typeof item === 'object' && item !== null) {
          return resolveTemplateVariables(item as Record<string, unknown>, context);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveTemplateVariables(value as Record<string, unknown>, context);
    } else {
      resolved[key] = value;
    }
  }

  return resolved;
}
