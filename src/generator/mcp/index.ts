import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import type { ParseResult } from '../../parser/types.js';
import type {
  McpClass,
  McpConstant,
  McpCssToken,
  McpFunction,
  McpHook,
  McpJsFunction,
  McpMethod,
  McpParam,
  McpProperty,
  McpReference,
  McpRestEndpoint,
  McpRestField,
  McpReturn,
} from './types.js';
import type {
  ParsedDocBlock,
  ParsedFunction,
  ParsedClass,
  ParsedMethod,
  ParsedProperty,
  ParsedConstant,
} from '../../parser/php/types.js';
import type { ParsedJsFunction, ParsedJsClass, ParsedJsDocBlock } from '../../parser/js/types.js';
import type { DetectedHook } from '../../parser/wordpress/types.js';
import type { RestEndpoint, RestField } from '../../parser/wordpress/rest-api.js';

// ─── PHP converters ───────────────────────────────────────────────────────────

function docDescription(doc: ParsedDocBlock | null): string {
  return doc?.description ?? '';
}

function docSince(doc: ParsedDocBlock | null): string | null {
  return doc?.since ?? null;
}

function docDeprecated(doc: ParsedDocBlock | null): string | null {
  return doc?.deprecated ?? null;
}

function docParams(doc: ParsedDocBlock | null): McpParam[] {
  if (!doc) return [];
  return doc.params.map((p) => ({
    name: p.name,
    type: p.type,
    description: p.description,
    optional: p.optional,
  }));
}

function docReturn(doc: ParsedDocBlock | null): McpReturn | null {
  if (!doc?.returns) return null;
  return { type: doc.returns.type, description: doc.returns.description };
}

function convertFunction(fn: ParsedFunction): McpFunction {
  return {
    name: fn.name,
    description: docDescription(fn.doc),
    params: docParams(fn.doc),
    returns: docReturn(fn.doc),
    since: docSince(fn.doc),
    deprecated: docDeprecated(fn.doc),
    file: fn.location.file,
    line: fn.location.line,
  };
}

function convertProperty(prop: ParsedProperty): McpProperty {
  return {
    name: prop.name,
    type: prop.typeHint ?? prop.doc?.varType ?? null,
    description: docDescription(prop.doc),
    visibility: prop.visibility,
    isStatic: prop.isStatic,
    file: prop.location.file,
    line: prop.location.line,
  };
}

function convertConstant(c: ParsedConstant): McpConstant {
  return {
    name: c.name,
    value: c.value,
    description: docDescription(c.doc),
    file: c.location.file,
    line: c.location.line,
  };
}

function convertMethod(m: ParsedMethod): McpMethod {
  return {
    name: m.name,
    description: docDescription(m.doc),
    params: docParams(m.doc),
    returns: docReturn(m.doc),
    since: docSince(m.doc),
    deprecated: docDeprecated(m.doc),
    visibility: m.visibility,
    isStatic: m.isStatic,
    isAbstract: m.isAbstract,
    file: m.location.file,
    line: m.location.line,
  };
}

function convertClass(cls: ParsedClass): McpClass {
  return {
    name: cls.name,
    description: docDescription(cls.doc),
    extends: cls.extends,
    implements: cls.implements,
    isAbstract: cls.isAbstract,
    isFinal: cls.isFinal,
    isInterface: cls.isInterface,
    isTrait: cls.isTrait,
    since: docSince(cls.doc),
    methods: cls.methods.map(convertMethod),
    properties: cls.properties.map(convertProperty),
    constants: cls.constants.map(convertConstant),
    file: cls.location.file,
    line: cls.location.line,
  };
}

// ─── REST endpoint converter ──────────────────────────────────────────────────

function convertRestEndpoint(ep: RestEndpoint): McpRestEndpoint {
  return {
    namespace: ep.namespace,
    route: ep.route,
    fullRoute: ep.fullRoute,
    methods: ep.methods,
    description: ep.description ?? '',
    params: (ep.params ?? []).map((p) => ({
      name: p.name,
      type: p.type,
      description: p.description,
      required: p.required,
    })),
    file: ep.file,
    line: ep.line,
  };
}

// ─── REST field converter ────────────────────────────────────────────────────

function convertRestField(field: RestField): McpRestField {
  return {
    objectType: field.objectType,
    fieldName: field.fieldName,
    description: field.description,
    type: field.type,
    context: field.context,
    hasGetCallback: field.hasGetCallback,
    hasUpdateCallback: field.hasUpdateCallback,
    file: field.file,
    line: field.line,
  };
}

// ─── Hook converter ───────────────────────────────────────────────────────────

function convertHook(hook: DetectedHook): McpHook {
  return {
    name: hook.name,
    type: hook.type,
    description: hook.description,
    since: hook.since,
    dispatchArgCount: hook.dispatchArgCount,
    params: hook.params.map((p) => ({
      name: p.name,
      type: p.type,
      description: p.description,
      optional: false,
    })),
    file: hook.location.file,
    line: hook.location.line,
  };
}

// ─── JS converters ────────────────────────────────────────────────────────────

function jsDocParams(doc: ParsedJsDocBlock | null): McpParam[] {
  if (!doc) return [];
  return doc.params.map((p) => ({
    name: p.name,
    type: p.type ?? 'any',
    description: p.description,
    optional: p.optional,
  }));
}

function jsDocReturn(doc: ParsedJsDocBlock | null): McpReturn | null {
  if (!doc?.returns) return null;
  return { type: doc.returns.type ?? 'any', description: doc.returns.description };
}

function convertJsFunction(fn: ParsedJsFunction): McpJsFunction {
  return {
    name: fn.name,
    description: fn.doc?.description ?? '',
    params: jsDocParams(fn.doc),
    returns: jsDocReturn(fn.doc),
    since: fn.doc?.since ?? null,
    deprecated: fn.doc?.deprecated ?? null,
    file: fn.location.file,
    line: fn.location.line,
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Build a structured MCP reference object from a {@link ParseResult}.
 *
 * Only includes public PHP functions and methods by default
 * (protected/private are included — callers can filter as needed).
 *
 * Note: reference overrides (user-supplied tips/code examples from F8) are
 * applied only during site scaffolding, not here. The MCP server serves
 * the raw reference without overrides — this is intentional since overrides
 * are a presentation-layer concern for the documentation site.
 */
export function buildMcpReference(parseResult: ParseResult): McpReference {
  const {
    pluginHeader,
    themeHeader,
    readme,
    php,
    js,
    css,
    hooks: hookResults,
    restEndpoints: rawRestEndpoints,
    restFields: rawRestFields,
  } = parseResult;

  const name = pluginHeader?.pluginName ?? themeHeader?.themeName ?? parseResult.config.name;

  const version =
    pluginHeader?.version ??
    themeHeader?.version ??
    readme?.stableTag ??
    parseResult.config.version ??
    null;

  const description =
    pluginHeader?.description ?? themeHeader?.description ?? readme?.shortDescription ?? null;

  // Aggregate PHP
  const functions: McpFunction[] = php.flatMap((r) => r.functions.map(convertFunction));
  const classes: McpClass[] = php.flatMap((r) => r.classes.map(convertClass));
  const constants: McpConstant[] = php.flatMap((r) => r.constants.map(convertConstant));

  // Aggregate hooks, deduplicate by name+type+usage+file+line
  const allHooks = hookResults.flatMap((r) => r.hooks).map(convertHook);
  const actions = allHooks.filter((h) => h.type === 'action');
  const filters = allHooks.filter((h) => h.type === 'filter');

  // REST endpoints
  const restEndpoints = (rawRestEndpoints ?? []).map(convertRestEndpoint);

  // REST fields
  const restFields = (rawRestFields ?? []).map(convertRestField);

  // JS functions (flatten classes into method list too — keep flat for MCP)
  const jsFunctions: McpJsFunction[] = [
    ...js.flatMap((r) => r.functions.map(convertJsFunction)),
    ...js.flatMap((r) =>
      r.classes.flatMap((cls: ParsedJsClass) =>
        cls.methods.map((m) => ({
          name: `${cls.name}.${m.name}`,
          description: m.doc?.description ?? '',
          params: jsDocParams(m.doc),
          returns: jsDocReturn(m.doc),
          since: m.doc?.since ?? null,
          deprecated: null,
          file: m.location.file,
          line: m.location.line,
        }))
      )
    ),
  ];

  // CSS tokens
  const cssTokens: McpCssToken[] = css.flatMap((r) =>
    r.customProperties.map((p) => ({
      name: p.name,
      value: p.value,
      description: p.description,
      scope: p.scope,
      file: p.location.file,
      line: p.location.line,
    }))
  );

  return {
    name,
    version,
    description,
    functions,
    classes,
    constants,
    hooks: { actions, filters },
    restEndpoints,
    restFields,
    js: { functions: jsFunctions },
    cssTokens,
  };
}

/**
 * Serialize an MCP reference to JSON and write it to disk.
 *
 * @param reference - The MCP reference object to write.
 * @param outputPath - Directory to write `mcp-reference.json` into, or a full file path.
 */
export function writeMcpReference(reference: McpReference, outputPath: string): string {
  let filePath = outputPath;
  if (!outputPath.endsWith('.json')) {
    filePath = resolve(outputPath, 'mcp-reference.json');
  }

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(reference, null, 2), 'utf8');
  return filePath;
}

export type * from './types.js';
