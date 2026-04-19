import { readFileSync } from 'fs';
import { glob } from 'glob';
import PhpParser from 'php-parser';

const Engine = PhpParser.Engine as unknown as new (opts: Record<string, unknown>) => {
  parseCode(src: string, filename: string): unknown;
};
import type { DetectedHook, HookExtractResult, HookType } from './types.js';
import type { SourceLocation } from '../php/types.js';

// ─── php-parser node shapes ───────────────────────────────────────────────────

interface PosNode {
  loc?: { start: { line: number; column: number } };
}
interface StringLiteralNode {
  kind: 'string';
  value: string;
}
interface NameNode {
  kind: 'name';
  name: string;
}
interface CallNode extends PosNode {
  kind: 'call';
  what: NameNode | { kind: string; name?: string };
  arguments: AstNode[];
  leadingComments?: CommentNode[];
}
interface CommentNode {
  kind: 'commentblock' | 'commentline';
  value: string;
}
type AstNode = StringLiteralNode | NameNode | CallNode | PosNode;

interface AssignNode extends PosNode {
  kind: 'assign';
  left: AstNode;
  right: AstNode;
}
interface ReturnNode extends PosNode {
  kind: 'return';
  expr: AstNode | null;
}
interface ExpressionStatementNode extends PosNode {
  kind: 'expressionstatement';
  expression: AstNode;
  leadingComments?: CommentNode[];
}
interface ProgramNode {
  children: unknown[];
}

// ─── Parser instance ──────────────────────────────────────────────────────────

const parser = new Engine({
  parser: { extractDoc: true, suppressErrors: true },
  ast: { withPositions: true },
});

// ─── Hook function names ──────────────────────────────────────────────────────

const DISPATCH_ACTIONS = new Set([
  'do_action',
  'apply_filters',
  'do_action_ref_array',
  'apply_filters_ref_array',
]);

function hookType(fnName: string): HookType {
  return fnName === 'do_action' || fnName === 'do_action_ref_array' ? 'action' : 'filter';
}

// ─── PHPDoc parsing ─────────────────────────────────────────────────────────

interface ParsedDoc {
  description: string;
  since: string | null;
  params: { name: string; type: string; description: string }[];
}

function parseDocComment(raw: string): ParsedDoc {
  const stripped = raw.replace(/^\/\*\*?\s*/, '').replace(/\s*\*\/$/, '');
  const lines = stripped.split('\n').map((l) => l.replace(/^\s*\*\s?/, ''));

  const descriptionLines: string[] = [];
  const params: { name: string; type: string; description: string }[] = [];
  let since: string | null = null;
  let inDescription = true;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('@')) {
      inDescription = false;

      const sinceMatch = trimmed.match(/^@since\s+(.+)/);
      if (sinceMatch) {
        since = sinceMatch[1]!.trim();
        continue;
      }

      const paramMatch = trimmed.match(/^@param\s+(.+?)\s+(\$\S+)\s*(.*)/);
      if (paramMatch) {
        params.push({
          type: paramMatch[1]!,
          name: paramMatch[2]!.replace(/^\$/, ''),
          description: paramMatch[3]?.trim() ?? '',
        });
        continue;
      }
    } else if (inDescription && trimmed.length > 0) {
      descriptionLines.push(trimmed);
    }
  }

  return {
    description: descriptionLines.join(' ').trim(),
    since,
    params,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stringValue(node: AstNode | undefined): string | null {
  if (!node) return null;
  if ((node as StringLiteralNode).kind === 'string') return (node as StringLiteralNode).value;
  return null;
}

function loc(file: string, node: PosNode): SourceLocation {
  return {
    file,
    line: node.loc?.start.line ?? 0,
    column: node.loc?.start.column ?? 0,
  };
}

// ─── Call node extraction ─────────────────────────────────────────────────────

function extractFromCall(
  file: string,
  callNode: CallNode,
  parentComments?: CommentNode[]
): DetectedHook | null {
  const fnName =
    (callNode.what as NameNode).kind === 'name' ? (callNode.what as NameNode).name : null;
  if (!fnName || !DISPATCH_ACTIONS.has(fnName)) return null;

  const args = callNode.arguments;
  const hookName = stringValue(args[0]);
  if (!hookName) return null; // Dynamic hook name — skip

  // Try to find a PHPDoc comment: on the call node itself, or on the parent statement
  let doc: ParsedDoc = { description: '', since: null, params: [] };
  const comments = callNode.leadingComments ?? parentComments ?? [];
  for (const c of comments) {
    if (c.kind === 'commentblock' && c.value.includes('/**')) {
      doc = parseDocComment(c.value);
      break;
    }
  }

  return {
    name: hookName,
    type: hookType(fnName),
    usage: 'dispatch',
    description: doc.description,
    since: doc.since,
    dispatchArgCount: args.length > 1 ? args.length - 1 : 0,
    params: doc.params,
    location: loc(file, callNode),
  };
}

// ─── AST walker ──────────────────────────────────────────────────────────────

/**
 * Recursively walk any AST node and collect dispatch hook calls
 * (do_action / apply_filters). Registrations (add_action / add_filter)
 * are intentionally skipped — they document the consumer, not the hook itself.
 */
function walkNode(
  file: string,
  node: unknown,
  results: DetectedHook[],
  parentComments?: CommentNode[]
): void {
  if (!node || typeof node !== 'object') return;

  const n = node as Record<string, unknown>;
  const kind = n['kind'] as string | undefined;

  if (kind === 'expressionstatement') {
    const stmt = n as unknown as ExpressionStatementNode;
    // Pass statement-level comments down to the call extraction
    walkNode(file, stmt.expression, results, stmt.leadingComments);
    return;
  }

  if (kind === 'call') {
    const hook = extractFromCall(file, n as unknown as CallNode, parentComments);
    if (hook) results.push(hook);
    // Still recurse into arguments (nested calls)
  }

  if (kind === 'assign') {
    walkNode(file, (n as unknown as AssignNode).right, results, parentComments);
    return;
  }

  if (kind === 'return') {
    walkNode(file, (n as unknown as ReturnNode).expr, results, parentComments);
    return;
  }

  // Recurse into all array/object values
  for (const value of Object.values(n)) {
    if (Array.isArray(value)) {
      for (const child of value) walkNode(file, child, results);
    } else if (value && typeof value === 'object' && (value as Record<string, unknown>)['kind']) {
      walkNode(file, value, results);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract all WordPress hook dispatches from a PHP file.
 *
 * Only captures do_action() / apply_filters() (and ref_array variants) —
 * the hooks a plugin defines for others to use. Registrations
 * (add_action / add_filter) are intentionally excluded.
 *
 * PHPDoc blocks preceding the dispatch call are parsed for description,
 * @since, and @param tags.
 */
export function extractHooks(file: string): HookExtractResult {
  const source = readFileSync(file, 'utf8');
  const ast = parser.parseCode(source, file) as ProgramNode;

  const hooks: DetectedHook[] = [];
  walkNode(file, ast, hooks);

  return { file, hooks };
}

/**
 * Extract hooks from all PHP files matching the given glob pattern(s).
 */
export async function extractHooksFromFiles(
  patterns: string | string[]
): Promise<HookExtractResult[]> {
  const globs = Array.isArray(patterns) ? patterns : [patterns];
  const files = await glob(globs, { absolute: true });
  return files.map((file) => extractHooks(file));
}

export type * from './types.js';
