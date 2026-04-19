import type { File, Node, CallExpression, Expression } from '@babel/types';
import type { WpApiUsage, WpBlockRegistration, WpDataUsage, WpHookCall } from './types.js';

// ─── AST shape helpers ────────────────────────────────────────────────────────

function isIdentifier(node: Node, name: string): boolean {
  return node.type === 'Identifier' && (node as { type: string; name: string }).name === name;
}

function isMemberExpression(
  node: Node,
  objectCheck: (n: Node) => boolean,
  property: string
): boolean {
  if (node.type !== 'MemberExpression') return false;
  const mem = node as {
    type: string;
    object: Node;
    property: Node;
    computed: boolean;
  };
  if (mem.computed) return false;
  return objectCheck(mem.object) && isIdentifier(mem.property, property);
}

/** Check if node is `wp.hooks` */
function isWpHooks(node: Node): boolean {
  return isMemberExpression(node, (n) => isIdentifier(n, 'wp'), 'hooks');
}

/** Check if node is `wp.data` */
function isWpData(node: Node): boolean {
  return isMemberExpression(node, (n) => isIdentifier(n, 'wp'), 'data');
}

/** Extract a string literal value from a node, or null if not a string literal. */
function stringLiteralValue(node: Node): string | null {
  if (node.type === 'StringLiteral') {
    return (node as { type: string; value: string }).value;
  }
  return null;
}

/** Extract a numeric literal value from a node, or undefined if not numeric. */
function numericLiteralValue(node: Node): number | undefined {
  if (node.type === 'NumericLiteral') {
    return (node as { type: string; value: number }).value;
  }
  return undefined;
}

function lineOf(node: Node): number {
  return (node as { loc?: { start: { line: number } } }).loc?.start.line ?? 0;
}

// ─── Traversal ────────────────────────────────────────────────────────────────

type Visitor = (node: Node) => void;

function traverse(node: Node, visitor: Visitor): void {
  visitor(node);
  // Iterate over all child nodes
  for (const key of Object.keys(node)) {
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && typeof (item as Node).type === 'string') {
          traverse(item as Node, visitor);
        }
      }
    } else if (child && typeof child === 'object' && typeof (child as Node).type === 'string') {
      traverse(child as Node, visitor);
    }
  }
}

// ─── Detection helpers ────────────────────────────────────────────────────────

const WP_HOOKS_METHODS = new Set(['addAction', 'addFilter', 'doAction', 'applyFilters']);
const WP_DATA_METHODS = new Set(['select', 'dispatch', 'subscribe']);

function tryExtractWpHook(call: CallExpression, file: string): WpHookCall | null {
  const callee = call.callee as Expression;
  if (callee.type !== 'MemberExpression') return null;

  const mem = callee as {
    type: string;
    object: Node;
    property: Node;
    computed: boolean;
  };

  if (mem.computed) return null;
  if (!isIdentifier(mem.property, '') && mem.property.type !== 'Identifier') return null;

  const methodName = (mem.property as { type: string; name: string }).name;
  if (!WP_HOOKS_METHODS.has(methodName)) return null;
  if (!isWpHooks(mem.object)) return null;

  const args = call.arguments;
  const hookName = args[0] ? stringLiteralValue(args[0] as Node) : null;
  if (hookName === null) return null;

  const type = methodName as WpHookCall['type'];

  if (type === 'addAction' || type === 'addFilter') {
    const namespace = args[1] ? (stringLiteralValue(args[1] as Node) ?? undefined) : undefined;
    // priority is arg index 3 (0=hookName, 1=namespace, 2=callback, 3=priority)
    const priority = args[3] ? (numericLiteralValue(args[3] as Node) ?? undefined) : undefined;
    return { type, hookName, namespace, priority, file, line: lineOf(call) };
  }

  // doAction / applyFilters
  return { type, hookName, file, line: lineOf(call) };
}

function tryExtractWpData(call: CallExpression, file: string): WpDataUsage | null {
  const callee = call.callee as Expression;
  if (callee.type !== 'MemberExpression') return null;

  const mem = callee as {
    type: string;
    object: Node;
    property: Node;
    computed: boolean;
  };

  if (mem.computed) return null;
  if (mem.property.type !== 'Identifier') return null;

  const methodName = (mem.property as { type: string; name: string }).name;
  if (!WP_DATA_METHODS.has(methodName)) return null;
  if (!isWpData(mem.object)) return null;

  const type = methodName as WpDataUsage['type'];
  const args = call.arguments;

  if (type === 'subscribe') {
    return { type, file, line: lineOf(call) };
  }

  const store = args[0] ? (stringLiteralValue(args[0] as Node) ?? undefined) : undefined;
  return { type, store, file, line: lineOf(call) };
}

function tryExtractBlockRegistration(
  call: CallExpression,
  file: string
): WpBlockRegistration | null {
  const callee = call.callee as Expression;

  // Match: registerBlockType(...)
  if (callee.type !== 'Identifier') return null;
  if ((callee as { type: string; name: string }).name !== 'registerBlockType') return null;

  const args = call.arguments;
  const blockName = args[0] ? stringLiteralValue(args[0] as Node) : null;
  if (blockName === null) return null;

  return { blockName, file, line: lineOf(call) };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Traverse a Babel AST and extract WordPress JavaScript API usages:
 * - wp.hooks calls (addAction, addFilter, doAction, applyFilters)
 * - wp.data calls (select, dispatch, subscribe)
 * - registerBlockType calls
 */
export function extractWpApis(ast: File, filePath: string): WpApiUsage {
  const hooks: WpHookCall[] = [];
  const data: WpDataUsage[] = [];
  const blocks: WpBlockRegistration[] = [];

  traverse(ast as unknown as Node, (node) => {
    if (node.type !== 'CallExpression') return;
    const call = node as CallExpression;

    const hook = tryExtractWpHook(call, filePath);
    if (hook) {
      hooks.push(hook);
      return;
    }

    const dataUsage = tryExtractWpData(call, filePath);
    if (dataUsage) {
      data.push(dataUsage);
      return;
    }

    const block = tryExtractBlockRegistration(call, filePath);
    if (block) blocks.push(block);
  });

  return { hooks, data, blocks };
}
