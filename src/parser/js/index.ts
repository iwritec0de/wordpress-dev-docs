import { readFileSync } from 'fs';
import { parse } from '@babel/parser';
import type {
  Node,
  File,
  Statement,
  ClassMethod,
  ClassBody,
  FunctionDeclaration,
  ClassDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  VariableDeclaration,
  ArrowFunctionExpression,
  FunctionExpression,
} from '@babel/types';
import { parseJsDocBlock } from './jsdoc.js';
import { extractWpApis } from './wp-apis.js';
import type {
  JsParseResult,
  ParsedJsClass,
  ParsedJsDocBlock,
  ParsedJsFunction,
  ParsedJsMethod,
  SourceLocation,
} from './types.js';

// ─── Internal node shape helpers ──────────────────────────────────────────────

interface CommentBlock {
  type: 'CommentBlock';
  value: string;
  start: number;
  end: number;
  loc: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

type NodeWithComments = Node & {
  leadingComments?: CommentBlock[] | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extract JSDoc from the leading comment immediately before a node.
 * Qualifies if the comment is a CommentBlock whose text starts with `*`
 * (i.e. it was originally `/** ... *\/`).
 */
function extractJsDoc(node: NodeWithComments): ParsedJsDocBlock | null {
  const comments = node.leadingComments;
  if (!comments || comments.length === 0) return null;

  // Find the last CommentBlock that starts with `*` (JSDoc style)
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (comment && comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
      // Babel strips the /* and */ — re-add them so our parser handles both forms
      return parseJsDocBlock('/*' + comment.value + '*/');
    }
  }
  return null;
}

function loc(file: string, node: Node): SourceLocation {
  return {
    file,
    line: node.loc?.start.line ?? 0,
    column: node.loc?.start.column ?? 0,
  };
}

// ─── Class parser ─────────────────────────────────────────────────────────────

function parseClass(file: string, node: ClassDeclaration): ParsedJsClass {
  const methods: ParsedJsMethod[] = [];

  const body = node.body as ClassBody;
  for (const member of body.body) {
    if (member.type !== 'ClassMethod') continue;
    const method = member as ClassMethod;
    const keyNode = method.key;
    let name = '';
    if (keyNode.type === 'Identifier') {
      name = keyNode.name;
    } else if (keyNode.type === 'StringLiteral') {
      name = keyNode.value;
    }
    methods.push({
      name,
      isStatic: method.static ?? false,
      doc: extractJsDoc(method as unknown as NodeWithComments),
      location: loc(file, method),
    });
  }

  return {
    name: node.id?.name ?? '',
    doc: extractJsDoc(node as unknown as NodeWithComments),
    methods,
    location: loc(file, node),
  };
}

// ─── Top-level statement walker ───────────────────────────────────────────────

function processStatement(
  file: string,
  stmt: Statement,
  functions: ParsedJsFunction[],
  classes: ParsedJsClass[]
): void {
  switch (stmt.type) {
    case 'FunctionDeclaration': {
      const fn = stmt as FunctionDeclaration;
      if (fn.id) {
        functions.push({
          name: fn.id.name,
          doc: extractJsDoc(fn as unknown as NodeWithComments),
          location: loc(file, fn),
        });
      }
      break;
    }

    case 'ClassDeclaration': {
      classes.push(parseClass(file, stmt as ClassDeclaration));
      break;
    }

    case 'ExportDefaultDeclaration': {
      const decl = (stmt as ExportDefaultDeclaration).declaration;
      if (decl.type === 'FunctionDeclaration') {
        const fn = decl as FunctionDeclaration;
        functions.push({
          name: fn.id?.name ?? 'default',
          doc: extractJsDoc(stmt as unknown as NodeWithComments),
          location: loc(file, fn),
        });
      } else if (decl.type === 'ClassDeclaration') {
        const cls = parseClass(file, decl as ClassDeclaration);
        // Attach JSDoc from the export statement if the class itself has none
        if (!cls.doc) {
          cls.doc = extractJsDoc(stmt as unknown as NodeWithComments);
        }
        classes.push(cls);
      }
      break;
    }

    case 'ExportNamedDeclaration': {
      const exportStmt = stmt as ExportNamedDeclaration;
      const inner = exportStmt.declaration;
      if (!inner) break;

      if (inner.type === 'FunctionDeclaration') {
        const fn = inner as FunctionDeclaration;
        if (fn.id) {
          functions.push({
            name: fn.id.name,
            doc: extractJsDoc(exportStmt as unknown as NodeWithComments),
            location: loc(file, fn),
          });
        }
      } else if (inner.type === 'ClassDeclaration') {
        const cls = parseClass(file, inner as ClassDeclaration);
        if (!cls.doc) {
          cls.doc = extractJsDoc(exportStmt as unknown as NodeWithComments);
        }
        classes.push(cls);
      } else if (inner.type === 'VariableDeclaration') {
        extractArrowFunctions(file, inner as VariableDeclaration, exportStmt, functions);
      }
      break;
    }

    case 'VariableDeclaration': {
      extractArrowFunctions(file, stmt as VariableDeclaration, stmt, functions);
      break;
    }

    default:
      break;
  }
}

/**
 * Extract arrow functions (and function expressions) from `const foo = () => {}`.
 * The JSDoc comment lives on either the VariableDeclaration or the parent export statement.
 */
function extractArrowFunctions(
  file: string,
  varDecl: VariableDeclaration,
  commentNode: Statement,
  functions: ParsedJsFunction[]
): void {
  for (const declarator of varDecl.declarations) {
    const init = declarator.init;
    if (!init) continue;
    if (init.type !== 'ArrowFunctionExpression' && init.type !== 'FunctionExpression') continue;

    const nameNode = declarator.id;
    if (nameNode.type !== 'Identifier') continue;

    // JSDoc attaches to the VariableDeclaration or its wrapping export statement
    const doc =
      extractJsDoc(varDecl as unknown as NodeWithComments) ??
      extractJsDoc(commentNode as unknown as NodeWithComments);

    functions.push({
      name: nameNode.name,
      doc,
      location: loc(file, init as ArrowFunctionExpression | FunctionExpression),
    });
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Parse a single JavaScript or TypeScript file and extract functions and classes
 * with their attached JSDoc blocks.
 */
export function parseJsFile(file: string): JsParseResult {
  const source = readFileSync(file, 'utf8');

  const ast: File = parse(source, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    attachComment: true,
  });

  const functions: ParsedJsFunction[] = [];
  const classes: ParsedJsClass[] = [];

  for (const stmt of ast.program.body) {
    processStatement(file, stmt, functions, classes);
  }

  const wpApis = extractWpApis(ast, file);

  return { file, functions, classes, wpApis };
}

export { parseJsDocBlock } from './jsdoc.js';
export type * from './types.js';
