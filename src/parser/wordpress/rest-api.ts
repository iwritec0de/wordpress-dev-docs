import { readFileSync } from 'fs';
import PhpParser from 'php-parser';

const Engine = PhpParser.Engine as unknown as new (opts: Record<string, unknown>) => {
  parseCode(src: string, filename: string): unknown;
};

// ─── REST field type ─────────────────────────────────────────────────────────

export interface RestField {
  /** Object type the field is registered on (e.g. 'post', 'comment', 'user') */
  objectType: string;
  /** Name of the custom field */
  fieldName: string;
  /** Description from the schema array */
  description: string;
  /** Type from the schema array (e.g. 'string', 'integer') */
  type: string;
  /** Context from the schema array (e.g. ['view', 'edit']) */
  context: string[];
  /** Whether a get_callback was provided */
  hasGetCallback: boolean;
  /** Whether an update_callback was provided */
  hasUpdateCallback: boolean;
  file: string;
  line: number;
}

// ─── REST endpoint type ───────────────────────────────────────────────────────

export interface RestEndpointParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface RestEndpoint {
  namespace: string;
  route: string;
  /** namespace + route, e.g. 'my-plugin/v1/items' */
  fullRoute: string;
  methods: string[];
  /** Callback function/method name, if statically resolvable */
  callback?: string;
  /** Permission callback name, if statically resolvable */
  permissionCallback?: string;
  /** From preceding PHPDoc comment */
  description?: string;
  /** Endpoint parameters extracted from the `args` array */
  params?: RestEndpointParam[];
  file: string;
  line: number;
}

// ─── php-parser node shapes ───────────────────────────────────────────────────

interface PosNode {
  loc?: { start: { line: number; column: number } };
}
interface StringLiteralNode extends PosNode {
  kind: 'string';
  value: string;
}
interface NameNode extends PosNode {
  kind: 'name';
  name: string;
}
interface StaticLookupNode extends PosNode {
  kind: 'staticlookup';
  what: AstNode;
  offset: AstNode;
}
interface CallNode extends PosNode {
  kind: 'call';
  what: NameNode | { kind: string; name?: string };
  arguments: AstNode[];
  leadingComments?: CommentNode[];
}
interface EntryNode extends PosNode {
  kind: 'entry';
  key: AstNode | null;
  value: AstNode;
}
interface ArrayNode extends PosNode {
  kind: 'array';
  items: (EntryNode | AstNode)[];
}
interface CommentNode {
  kind: 'commentblock' | 'commentline';
  value: string;
}
type AstNode =
  | StringLiteralNode
  | NameNode
  | StaticLookupNode
  | CallNode
  | ArrayNode
  | EntryNode
  | PosNode;

interface ProgramNode {
  children: unknown[];
}

// ─── WP_REST_Server constant mappings ────────────────────────────────────────

const WP_REST_SERVER_METHODS: Record<string, string[]> = {
  READABLE: ['GET'],
  CREATABLE: ['POST'],
  EDITABLE: ['POST', 'PUT', 'PATCH'],
  DELETABLE: ['DELETE'],
  ALLMETHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

// ─── Parser instance ──────────────────────────────────────────────────────────

const parser = new Engine({
  parser: { extractDoc: true, suppressErrors: true },
  ast: { withPositions: true },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stringValue(node: AstNode | undefined): string | null {
  if (!node) return null;
  if ((node as StringLiteralNode).kind === 'string') return (node as StringLiteralNode).value;
  return null;
}

function unwrapEntry(node: AstNode | EntryNode): AstNode {
  return (node as EntryNode).kind === 'entry' ? (node as EntryNode).value : (node as AstNode);
}

function entryKey(node: AstNode | EntryNode): string | null {
  if ((node as EntryNode).kind !== 'entry') return null;
  const key = (node as EntryNode).key;
  if (!key) return null;
  return stringValue(key as AstNode);
}

/**
 * Resolve a methods value node to a string array.
 * Handles: string literal, array of strings, WP_REST_Server::CONSTANT.
 */
function resolveMethods(node: AstNode | undefined): string[] {
  if (!node) return [];

  // Array of strings
  if ((node as ArrayNode).kind === 'array') {
    const items = (node as ArrayNode).items;
    const result: string[] = [];
    for (const item of items) {
      const val = stringValue(unwrapEntry(item as AstNode | EntryNode));
      if (val) result.push(val.toUpperCase());
    }
    return result.length > 0 ? result : [];
  }

  // String literal: 'GET' or 'GET,POST'
  if ((node as StringLiteralNode).kind === 'string') {
    const raw = (node as StringLiteralNode).value;
    return raw
      .split(',')
      .map((m) => m.trim().toUpperCase())
      .filter(Boolean);
  }

  // WP_REST_Server::READABLE etc. — offset node is 'identifier' in php-parser
  if ((node as StaticLookupNode).kind === 'staticlookup') {
    const offset = (node as StaticLookupNode).offset;
    const kind = (offset as NameNode).kind;
    const constName = kind === 'name' || kind === 'identifier' ? (offset as NameNode).name : null;
    if (constName && WP_REST_SERVER_METHODS[constName]) {
      return WP_REST_SERVER_METHODS[constName];
    }
  }

  return [];
}

/**
 * Resolve a callback value node to a string name if statically determinable.
 */
function resolveCallbackName(node: AstNode | undefined): string | undefined {
  if (!node) return undefined;
  const str = stringValue(node);
  if (str) return str;

  // Array callback: [$this, 'method'] or ['ClassName', 'method']
  if ((node as ArrayNode).kind === 'array') {
    const items = (node as ArrayNode).items;
    if (items.length >= 2) {
      const methodNode = unwrapEntry(items[1] as AstNode | EntryNode);
      const method = stringValue(methodNode);
      if (method) return method;
    }
  }
  return undefined;
}

/**
 * Extract endpoint parameters from a WP `args` array node.
 *
 * WordPress REST API args look like:
 *   'args' => array(
 *     'key' => array( 'description' => '...', 'type' => 'string', 'required' => false ),
 *   )
 */
function extractEndpointParams(argsNode: AstNode | undefined): RestEndpointParam[] {
  if (!argsNode || (argsNode as ArrayNode).kind !== 'array') return [];

  const params: RestEndpointParam[] = [];
  for (const item of (argsNode as ArrayNode).items) {
    const paramName = entryKey(item as AstNode | EntryNode);
    if (!paramName) continue;

    const paramDef = unwrapEntry(item as AstNode | EntryNode);
    if ((paramDef as ArrayNode).kind !== 'array') continue;

    let type = 'mixed';
    let description = '';
    let required = false;

    for (const prop of (paramDef as ArrayNode).items) {
      const propKey = entryKey(prop as AstNode | EntryNode);
      if (!propKey) continue;
      const propVal = unwrapEntry(prop as AstNode | EntryNode);

      if (propKey === 'type') {
        type = stringValue(propVal) ?? 'mixed';
      } else if (propKey === 'description') {
        // Handle __() wrapped strings: __('desc', 'text-domain')
        if ((propVal as CallNode).kind === 'call') {
          const callArgs = (propVal as CallNode).arguments;
          if (callArgs.length > 0) {
            description = stringValue(callArgs[0] as AstNode) ?? '';
          }
        } else {
          description = stringValue(propVal) ?? '';
        }
      } else if (propKey === 'required') {
        // Boolean literal or string 'true'/'false'
        const n = propVal as PosNode & { kind: string; value?: unknown; raw?: string };
        if (n.kind === 'boolean') {
          required = n.value === true || n.raw === 'true';
        } else {
          const str = stringValue(propVal);
          required = str === 'true' || str === '1';
        }
      }
    }

    params.push({ name: paramName, type, description, required });
  }
  return params;
}

/**
 * Extract a single endpoint record from an args array node.
 * The args array contains entries like: methods, callback, permission_callback.
 */
function extractFromArgsArray(
  argsNode: ArrayNode,
  namespace: string,
  route: string,
  file: string,
  line: number,
  description?: string
): RestEndpoint | null {
  let methods: string[] = [];
  let callback: string | undefined;
  let permissionCallback: string | undefined;
  let params: RestEndpointParam[] = [];

  for (const item of argsNode.items) {
    const key = entryKey(item as AstNode | EntryNode);
    if (!key) continue;
    const val = unwrapEntry(item as AstNode | EntryNode);

    if (key === 'methods') {
      methods = resolveMethods(val);
    } else if (key === 'callback') {
      callback = resolveCallbackName(val);
    } else if (key === 'permission_callback') {
      permissionCallback = resolveCallbackName(val);
    } else if (key === 'args') {
      params = extractEndpointParams(val);
    }
  }

  const fullRoute = `${namespace}${route}`;

  return {
    namespace,
    route,
    fullRoute,
    methods,
    ...(callback !== undefined && { callback }),
    ...(permissionCallback !== undefined && { permissionCallback }),
    ...(description !== undefined && { description }),
    ...(params.length > 0 && { params }),
    file,
    line,
  };
}

/**
 * Extract description from a leading PHPDoc comment string.
 * Strips `/** ... * /` wrapper and leading `* ` prefixes.
 */
function parseDocComment(raw: string): string {
  // Strip /** and */
  const stripped = raw.replace(/^\/\*\*?\s*/, '').replace(/\s*\*\/$/, '');

  // Extract first non-empty line that isn't a @tag
  const lines = stripped
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').trim())
    .filter((l) => l.length > 0 && !l.startsWith('@'));

  return lines[0] ?? '';
}

// ─── AST walker ──────────────────────────────────────────────────────────────

function walkNode(file: string, node: unknown, results: RestEndpoint[]): void {
  if (!node || typeof node !== 'object') return;

  const n = node as Record<string, unknown>;
  const kind = n['kind'] as string | undefined;

  if (kind === 'call') {
    const callNode = n as unknown as CallNode;
    const what = callNode.what as NameNode;
    const fnName = what.kind === 'name' ? what.name : null;

    if (fnName === 'register_rest_route') {
      const args = callNode.arguments;
      const namespace = stringValue(args[0] as AstNode | undefined);
      const route = stringValue(args[1] as AstNode | undefined);
      const line = callNode.loc?.start.line ?? 0;

      // Extract description from leading comments on the call or its parent statement
      let description: string | undefined;
      const comments = (n['leadingComments'] ?? []) as CommentNode[];
      for (const c of comments) {
        if (c.kind === 'commentblock' && c.value.startsWith('/**')) {
          description = parseDocComment(c.value) || undefined;
          break;
        }
      }

      if (namespace && route) {
        const thirdArg = args[2] as AstNode | undefined;

        if (thirdArg && (thirdArg as ArrayNode).kind === 'array') {
          const argsArray = thirdArg as ArrayNode;

          // Check if it's a list of method config arrays (multiple HTTP methods)
          // i.e. [ [ 'methods' => ..., ... ], [ 'methods' => ..., ... ] ]
          //
          // Require:
          //   1. every item is itself an array
          //   2. at least one sub-array has a 'methods' key
          //   3. no top-level 'methods' key (which would indicate a single config
          //      array whose values happen to be arrays, e.g. args => [...])
          const hasTopLevelMethodsKey = argsArray.items.some(
            (item) => entryKey(item as AstNode | EntryNode) === 'methods'
          );
          const subArrayHasMethods = (arr: ArrayNode): boolean =>
            arr.items.some((sub) => entryKey(sub as AstNode | EntryNode) === 'methods');
          const isListOfConfigs =
            !hasTopLevelMethodsKey &&
            argsArray.items.length > 0 &&
            argsArray.items.every((item) => {
              const val = unwrapEntry(item as AstNode | EntryNode);
              return (val as ArrayNode).kind === 'array';
            }) &&
            argsArray.items.some((item) =>
              subArrayHasMethods(unwrapEntry(item as AstNode | EntryNode) as ArrayNode)
            );

          if (isListOfConfigs) {
            // Multiple method configs — emit one endpoint per config
            for (const item of argsArray.items) {
              const configArray = unwrapEntry(item as AstNode | EntryNode) as ArrayNode;
              const ep = extractFromArgsArray(
                configArray,
                namespace,
                route,
                file,
                line,
                description
              );
              if (ep) results.push(ep);
            }
          } else {
            // Single args array
            const ep = extractFromArgsArray(argsArray, namespace, route, file, line, description);
            if (ep) results.push(ep);
          }
        } else {
          // Third arg missing or not an array — emit minimal endpoint
          results.push({
            namespace,
            route,
            fullRoute: `${namespace}${route}`,
            methods: [],
            ...(description !== undefined && { description }),
            file,
            line,
          });
        }
      }
    }
  }

  // Recurse into all child nodes
  for (const value of Object.values(n)) {
    if (Array.isArray(value)) {
      for (const child of value) walkNode(file, child, results);
    } else if (value && typeof value === 'object' && (value as Record<string, unknown>)['kind']) {
      walkNode(file, value, results);
    }
  }
}

// ─── REST field AST walker ──────────────────────────────────────────────────

/**
 * Unwrap WordPress translation wrappers like `__('text', 'domain')` to the
 * inner string value. Returns the raw string value for string literals, or
 * null if the node cannot be resolved.
 */
function unwrapTranslation(node: AstNode | undefined): string | null {
  if (!node) return null;
  const str = stringValue(node);
  if (str !== null) return str;

  // Check for __() or esc_html__() etc. translation calls
  if ((node as CallNode).kind === 'call') {
    const call = node as CallNode;
    const what = call.what as NameNode;
    const fnName = what.kind === 'name' ? what.name : null;
    if (fnName && /^(?:__|esc_html__|esc_attr__|_e|esc_html_e|_x|_ex|_n)$/.test(fnName)) {
      const firstArg = call.arguments[0] as AstNode | undefined;
      if (firstArg) return stringValue(firstArg);
    }
  }
  return null;
}

/**
 * Extract schema information from the third argument array of register_rest_field().
 */
function extractFieldSchema(argsNode: ArrayNode): {
  description: string;
  type: string;
  context: string[];
  hasGetCallback: boolean;
  hasUpdateCallback: boolean;
} {
  let description = '';
  let type = '';
  let context: string[] = [];
  let hasGetCallback = false;
  let hasUpdateCallback = false;

  for (const item of argsNode.items) {
    const key = entryKey(item as AstNode | EntryNode);
    if (!key) continue;
    const val = unwrapEntry(item as AstNode | EntryNode);

    if (key === 'get_callback') {
      hasGetCallback = true;
    } else if (key === 'update_callback') {
      hasUpdateCallback = true;
    } else if (key === 'schema' && (val as ArrayNode).kind === 'array') {
      const schemaArray = val as ArrayNode;
      for (const schemaItem of schemaArray.items) {
        const schemaKey = entryKey(schemaItem as AstNode | EntryNode);
        if (!schemaKey) continue;
        const schemaVal = unwrapEntry(schemaItem as AstNode | EntryNode);

        if (schemaKey === 'description') {
          description = unwrapTranslation(schemaVal) ?? '';
        } else if (schemaKey === 'type') {
          type = stringValue(schemaVal) ?? '';
        } else if (schemaKey === 'context' && (schemaVal as ArrayNode).kind === 'array') {
          const ctxArray = schemaVal as ArrayNode;
          for (const ctxItem of ctxArray.items) {
            const ctxVal = stringValue(unwrapEntry(ctxItem as AstNode | EntryNode));
            if (ctxVal) context.push(ctxVal);
          }
        }
      }
    }
  }

  return { description, type, context, hasGetCallback, hasUpdateCallback };
}

function walkNodeForFields(file: string, node: unknown, results: RestField[]): void {
  if (!node || typeof node !== 'object') return;

  const n = node as Record<string, unknown>;
  const kind = n['kind'] as string | undefined;

  if (kind === 'call') {
    const callNode = n as unknown as CallNode;
    const what = callNode.what as NameNode;
    const fnName = what.kind === 'name' ? what.name : null;

    if (fnName === 'register_rest_field') {
      const args = callNode.arguments;
      const line = callNode.loc?.start.line ?? 0;

      // Arg 1: object type — string or array of strings
      const objectTypeArg = args[0] as AstNode | undefined;
      const objectTypes: string[] = [];

      if (objectTypeArg) {
        if ((objectTypeArg as ArrayNode).kind === 'array') {
          const arrNode = objectTypeArg as ArrayNode;
          for (const item of arrNode.items) {
            const val = stringValue(unwrapEntry(item as AstNode | EntryNode));
            if (val) objectTypes.push(val);
          }
        } else {
          const val = stringValue(objectTypeArg);
          if (val) objectTypes.push(val);
        }
      }

      // Arg 2: field name
      const fieldName = stringValue(args[1] as AstNode | undefined);

      // Arg 3: config array with get_callback, update_callback, schema
      const thirdArg = args[2] as AstNode | undefined;
      let schema = {
        description: '',
        type: '',
        context: [] as string[],
        hasGetCallback: false,
        hasUpdateCallback: false,
      };

      if (thirdArg && (thirdArg as ArrayNode).kind === 'array') {
        schema = extractFieldSchema(thirdArg as ArrayNode);
      }

      if (fieldName && objectTypes.length > 0) {
        for (const objectType of objectTypes) {
          results.push({
            objectType,
            fieldName,
            description: schema.description,
            type: schema.type,
            context: schema.context,
            hasGetCallback: schema.hasGetCallback,
            hasUpdateCallback: schema.hasUpdateCallback,
            file,
            line,
          });
        }
      }
    }
  }

  // Recurse into all child nodes
  for (const value of Object.values(n)) {
    if (Array.isArray(value)) {
      for (const child of value) walkNodeForFields(file, child, results);
    } else if (value && typeof value === 'object' && (value as Record<string, unknown>)['kind']) {
      walkNodeForFields(file, value, results);
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract all `register_rest_route()` calls from a PHP file.
 *
 * Returns one {@link RestEndpoint} per method configuration block.
 */
export function extractRestEndpoints(file: string): RestEndpoint[] {
  const source = readFileSync(file, 'utf8');
  const ast = parser.parseCode(source, file) as ProgramNode;

  const results: RestEndpoint[] = [];
  walkNode(file, ast, results);
  return results;
}

/**
 * Extract all `register_rest_field()` calls from a PHP file.
 *
 * Returns one {@link RestField} per object type (when the first argument is
 * an array, one entry is emitted per type).
 */
export function extractRestFields(file: string): RestField[] {
  const source = readFileSync(file, 'utf8');
  const ast = parser.parseCode(source, file) as ProgramNode;

  const results: RestField[] = [];
  walkNodeForFields(file, ast, results);
  return results;
}
