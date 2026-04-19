import { readFileSync } from 'fs';
import { glob } from 'glob';
import PhpParser from 'php-parser';

const Engine = PhpParser.Engine as unknown as new (opts: Record<string, unknown>) => {
  parseCode(src: string, filename: string): unknown;
};
import { parseDocBlock } from './phpdoc.js';
import type {
  ParsedClass,
  ParsedConstant,
  ParsedDocBlock,
  ParsedFunction,
  ParsedMethod,
  ParsedParam,
  ParsedProperty,
  PhpParseResult,
  SourceLocation,
} from './types.js';

// ─── php-parser AST node shapes (subset we use) ──────────────────────────────

interface PosNode {
  loc?: { start: { line: number; column: number } };
}
interface CommentNode {
  kind: string;
  value: string;
}
interface IdentifierNode {
  name: string;
}
interface TypeReferenceNode {
  kind: 'typereference' | 'uniontype' | 'intersectiontype' | 'nullabletype' | 'name';
  name?: string;
  types?: TypeReferenceNode[];
  raw?: string;
}
interface ParameterNode extends PosNode {
  kind: 'parameter';
  name: IdentifierNode;
  type: TypeReferenceNode | null;
  nullable: boolean;
  value: unknown | null;
  variadic: boolean;
  byref: boolean;
}
interface FunctionNode extends PosNode {
  kind: 'function';
  name: IdentifierNode;
  arguments: ParameterNode[];
  type: TypeReferenceNode | null;
  leadingComments?: CommentNode[];
}
interface MethodNode extends PosNode {
  kind: 'method';
  name: IdentifierNode | string;
  arguments: ParameterNode[];
  type: TypeReferenceNode | null;
  visibility: string;
  isStatic: boolean;
  isAbstract: boolean;
  leadingComments?: CommentNode[];
}
interface PropertyNode extends PosNode {
  kind: 'property';
  name: IdentifierNode;
  type: TypeReferenceNode | null;
}
interface PropertyStatementNode extends PosNode {
  kind: 'propertystatement';
  visibility: string;
  isStatic: boolean;
  type: TypeReferenceNode | null;
  properties: PropertyNode[];
  leadingComments?: CommentNode[];
}
interface ClassConstantEntryNode extends PosNode {
  kind: 'classconstant' | 'constant';
  name: IdentifierNode;
  value: { kind: string; raw?: string; value?: unknown } | null;
}
interface ClassConstantStatementNode extends PosNode {
  kind: 'classconstant';
  constants: ClassConstantEntryNode[];
  leadingComments?: CommentNode[];
}
interface NameNode {
  kind: 'name';
  name: string;
}
interface ClassNode extends PosNode {
  kind: 'class' | 'interface' | 'trait';
  name: IdentifierNode;
  extends: NameNode | null;
  implements: NameNode[] | null;
  isAbstract: boolean;
  isFinal: boolean;
  body: Array<MethodNode | PropertyStatementNode | ClassConstantStatementNode | PosNode>;
  leadingComments?: CommentNode[];
}
interface ExpressionStatementNode extends PosNode {
  kind: 'expressionstatement';
  expression: {
    kind: 'call';
    what: { kind: string; name?: string };
    arguments: Array<{ kind: string; raw?: string; value?: unknown; offset?: unknown }>;
  };
  leadingComments?: CommentNode[];
}
interface ProgramNode {
  children: Array<FunctionNode | ClassNode | ExpressionStatementNode | PosNode>;
}

// ─── Parser instance ──────────────────────────────────────────────────────────

const parser = new Engine({
  parser: { extractDoc: true, suppressErrors: true },
  ast: { withPositions: true },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDocBlock(node: { leadingComments?: CommentNode[] }): ParsedDocBlock | null {
  const comments = node.leadingComments ?? [];
  const comment = comments
    .slice()
    .reverse()
    .find((c: CommentNode) => c.kind === 'commentblock');
  if (!comment) return null;
  return parseDocBlock(comment.value);
}

function loc(file: string, node: PosNode): SourceLocation {
  return {
    file,
    line: node.loc?.start.line ?? 0,
    column: node.loc?.start.column ?? 0,
  };
}

function methodName(node: MethodNode): string {
  return typeof node.name === 'string' ? node.name : node.name.name;
}

/** Convert a php-parser type node to a human-readable string */
function typeNodeToString(typeNode: TypeReferenceNode | null): string | null {
  if (!typeNode) return null;

  switch (typeNode.kind) {
    case 'typereference':
      return typeNode.name ?? typeNode.raw ?? null;
    case 'name':
      return typeNode.name ?? null;
    case 'nullabletype':
      return typeNode.types?.[0] ? '?' + typeNodeToString(typeNode.types[0]) : null;
    case 'uniontype':
      return typeNode.types?.map(typeNodeToString).join('|') ?? null;
    case 'intersectiontype':
      return typeNode.types?.map(typeNodeToString).join('&') ?? null;
    default:
      return null;
  }
}

/** Render a default value AST node to a string */
function defaultValueToString(valueNode: unknown): string | null {
  if (valueNode === null || valueNode === undefined) return null;
  const v = valueNode as { kind: string; raw?: string; value?: unknown };
  if (v.raw !== undefined) return String(v.raw);
  if (v.value !== undefined) return JSON.stringify(v.value);
  return null;
}

/** Extract parsed parameters from a function/method node */
function extractParams(args: ParameterNode[]): ParsedParam[] {
  return args.map((arg) => {
    const rawType = typeNodeToString(arg.type);
    const nullable = arg.nullable || (rawType?.startsWith('?') ?? false);
    return {
      name: arg.name.name,
      typeHint: rawType ? rawType.replace(/^\?/, '') : null,
      nullable,
      hasDefault: arg.value !== null,
      defaultValue: defaultValueToString(arg.value),
      variadic: arg.variadic ?? false,
      byRef: arg.byref ?? false,
    };
  });
}

/** Extract the raw value string from a constant value node */
function constantValueToString(
  valueNode: { kind: string; raw?: string; value?: unknown } | null
): string | null {
  if (!valueNode) return null;
  if (valueNode.raw !== undefined) return String(valueNode.raw);
  if (valueNode.value !== undefined) return JSON.stringify(valueNode.value);
  return null;
}

// ─── Class / interface / trait parser ────────────────────────────────────────

function parseClassLike(file: string, node: ClassNode): ParsedClass {
  const methods: ParsedMethod[] = [];
  const properties: ParsedProperty[] = [];
  const constants: ParsedConstant[] = [];

  for (const member of node.body) {
    const kind = (member as { kind: string }).kind;

    if (kind === 'method') {
      const m = member as MethodNode;
      methods.push({
        name: methodName(m),
        returnType: typeNodeToString(m.type),
        params: extractParams(m.arguments ?? []),
        visibility: (m.visibility as ParsedMethod['visibility']) ?? 'public',
        isStatic: m.isStatic ?? false,
        isAbstract: m.isAbstract ?? false,
        doc: extractDocBlock(m),
        location: loc(file, m),
      });
    } else if (kind === 'propertystatement') {
      const ps = member as PropertyStatementNode;
      const doc = extractDocBlock(ps);
      for (const prop of ps.properties) {
        // Type hint lives on the individual property node in php-parser
        const typeHint = typeNodeToString(prop.type) ?? typeNodeToString(ps.type);
        properties.push({
          name: prop.name.name,
          visibility: (ps.visibility as ParsedProperty['visibility']) ?? 'public',
          isStatic: ps.isStatic ?? false,
          typeHint,
          doc,
          location: {
            file,
            line: prop.loc?.start.line ?? ps.loc?.start.line ?? 0,
            column: prop.loc?.start.column ?? 0,
          },
        });
      }
    } else if (kind === 'classconstant') {
      const cs = member as ClassConstantStatementNode;
      const doc = extractDocBlock(cs);
      for (const entry of cs.constants) {
        constants.push({
          name: entry.name.name,
          value: constantValueToString(entry.value),
          doc,
          location: loc(file, entry),
        });
      }
    }
  }

  return {
    name: node.name.name,
    extends: node.extends?.name ?? null,
    implements: node.implements?.map((i) => i.name) ?? [],
    isAbstract: node.isAbstract ?? false,
    isFinal: node.isFinal ?? false,
    isInterface: node.kind === 'interface',
    isTrait: node.kind === 'trait',
    doc: extractDocBlock(node),
    methods,
    properties,
    constants,
    location: loc(file, node),
  };
}

// ─── Top-level define() extraction ───────────────────────────────────────────

function tryExtractDefine(file: string, node: ExpressionStatementNode): ParsedConstant | null {
  const expr = node.expression;
  if (expr?.kind !== 'call') return null;
  const fnName = expr.what.kind === 'name' ? expr.what.name : undefined;
  if (fnName !== 'define') return null;

  const nameArg = expr.arguments[0];
  const valueArg = expr.arguments[1];
  if (!nameArg) return null;

  const name =
    (nameArg as { kind: string; value?: string }).value ??
    String((nameArg as { kind: string; raw?: string }).raw ?? '').replace(/['"]/g, '');

  return {
    name,
    value: constantValueToString(
      (valueArg as { kind: string; raw?: string; value?: unknown } | null) ?? null
    ),
    doc: extractDocBlock(node),
    location: loc(file, node),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a single PHP file and extract functions, classes, and constants
 * including full signature information (parameter types, return types,
 * class inheritance, class constants).
 */
export function parsePhpFile(file: string): PhpParseResult {
  const source = readFileSync(file, 'utf8');
  const ast = parser.parseCode(source, file) as ProgramNode;

  const functions: ParsedFunction[] = [];
  const classes: ParsedClass[] = [];
  const constants: ParsedConstant[] = [];

  for (const node of ast.children) {
    const kind = (node as { kind: string }).kind;

    if (kind === 'function') {
      const fn = node as FunctionNode;
      functions.push({
        name: fn.name.name,
        returnType: typeNodeToString(fn.type),
        params: extractParams(fn.arguments ?? []),
        doc: extractDocBlock(fn),
        location: loc(file, fn),
      });
    } else if (kind === 'class' || kind === 'interface' || kind === 'trait') {
      classes.push(parseClassLike(file, node as ClassNode));
    } else if (kind === 'expressionstatement') {
      const constant = tryExtractDefine(file, node as ExpressionStatementNode);
      if (constant) constants.push(constant);
    }
  }

  return { file, functions, classes, constants };
}

/**
 * Parse all PHP files matching the given glob pattern(s).
 */
export async function parsePhpFiles(patterns: string | string[]): Promise<PhpParseResult[]> {
  const globs = Array.isArray(patterns) ? patterns : [patterns];
  const files = await glob(globs, { absolute: true });
  return files.map((file) => parsePhpFile(file));
}

export { parseDocBlock } from './phpdoc.js';
export type * from './types.js';
