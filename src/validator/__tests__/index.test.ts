import { describe, it, expect } from 'vitest';
import { validateDocs } from '../index.js';
import type { ParseResult } from '../../parser/types.js';
import type {
  PhpParseResult,
  ParsedFunction,
  ParsedClass,
  ParsedMethod,
} from '../../parser/php/types.js';
import type { JsParseResult, ParsedJsFunction } from '../../parser/js/types.js';
import type { HookExtractResult, DetectedHook } from '../../parser/wordpress/types.js';

// ─── Minimal ParseResult builder ──────────────────────────────────────────────

function makeResult(overrides: Partial<ParseResult> = {}): ParseResult {
  return {
    sourceRoot: '/tmp/plugin',
    config: {
      name: 'test-plugin',
      type: 'plugin',
      source: '/tmp/plugin',
      exclude: [],
      output: './docs',
      theme: 'default',
      site: { baseUrl: '/' },
      mcp: { enabled: false, output: './mcp' },
      groups: [],
    },
    php: [],
    js: [],
    css: [],
    hooks: [],
    restEndpoints: [],
    restFields: [],
    blocks: [],
    pluginHeader: null,
    themeHeader: null,
    readme: null,
    skippedFiles: [],
    errors: [],
    ...overrides,
  };
}

// ─── PHP fixture helpers ──────────────────────────────────────────────────────

function makePhpFunction(overrides: Partial<ParsedFunction> = {}): ParsedFunction {
  return {
    name: 'my_function',
    returnType: null,
    params: [],
    doc: null,
    location: { file: '/tmp/plugin/plugin.php', line: 10, column: 0 },
    ...overrides,
  };
}

function makePhpClass(overrides: Partial<ParsedClass> = {}): ParsedClass {
  return {
    name: 'MyClass',
    extends: null,
    implements: [],
    isAbstract: false,
    isFinal: false,
    isInterface: false,
    isTrait: false,
    doc: null,
    methods: [],
    properties: [],
    constants: [],
    location: { file: '/tmp/plugin/plugin.php', line: 30, column: 0 },
    ...overrides,
  };
}

function makePublicMethod(overrides: Partial<ParsedMethod> = {}): ParsedMethod {
  return {
    name: 'myMethod',
    visibility: 'public',
    isStatic: false,
    isAbstract: false,
    returnType: null,
    params: [],
    doc: null,
    location: { file: '/tmp/plugin/plugin.php', line: 35, column: 2 },
    ...overrides,
  };
}

function makePhpResult(
  file: string,
  functions: ParsedFunction[] = [],
  classes: ParsedClass[] = []
): PhpParseResult {
  return { file, functions, classes, constants: [] };
}

// ─── JS fixture helpers ───────────────────────────────────────────────────────

function makeJsFunction(overrides: Partial<ParsedJsFunction> = {}): ParsedJsFunction {
  return {
    name: 'myJsFunction',
    doc: null,
    location: { file: '/tmp/plugin/index.js', line: 5, column: 0 },
    ...overrides,
  };
}

function makeJsResult(file: string, functions: ParsedJsFunction[] = []): JsParseResult {
  return { file, functions, classes: [] };
}

// ─── Hook fixture helpers ─────────────────────────────────────────────────────

function makeHook(overrides: Partial<DetectedHook> = {}): DetectedHook {
  return {
    name: 'my_plugin_init',
    type: 'action',
    usage: 'dispatch',
    priority: null,
    acceptedArgs: null,
    callback: null,
    dispatchArgCount: 0,
    location: { file: '/tmp/plugin/plugin.php', line: 15, column: 0 },
    ...overrides,
  };
}

function makeHookResult(file: string, hooks: DetectedHook[] = []): HookExtractResult {
  return { file, hooks };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('validateDocs()', () => {
  // ── 1. Fully documented → no issues ─────────────────────────────────────────
  it('returns empty issues for a fully-documented plugin', () => {
    const fn = makePhpFunction({
      doc: {
        description: 'Does something useful.',
        params: [{ type: 'string', name: '$key', description: 'The key', optional: false }],
        returns: { type: 'bool', description: 'True on success' },
        throws: [],
        tags: [],
        raw: '',
      },
      params: [
        {
          name: '$key',
          typeHint: 'string',
          nullable: false,
          hasDefault: false,
          defaultValue: null,
          variadic: false,
          byRef: false,
        },
      ],
      returnType: 'bool',
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues, stats } = validateDocs(result);
    expect(issues).toHaveLength(0);
    expect(stats.total).toBe(1);
    expect(stats.documented).toBe(1);
    expect(stats.coverage).toBe(100);
  });

  // ── 2. Function missing PHPDoc → error ──────────────────────────────────────
  it('detects a function missing PHPDoc as an error', () => {
    const fn = makePhpFunction({ name: 'undocumented_fn', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.symbol === 'undocumented_fn');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('missing-doc');
    expect(issue?.severity).toBe('error');
  });

  // ── 3. Function with missing @param → warning ────────────────────────────────
  it('detects a missing @param tag as a warning', () => {
    const fn = makePhpFunction({
      name: 'needs_param',
      params: [
        {
          name: '$value',
          typeHint: 'string',
          nullable: false,
          hasDefault: false,
          defaultValue: null,
          variadic: false,
          byRef: false,
        },
      ],
      doc: {
        description: 'Does something.',
        params: [], // missing @param
        returns: { type: 'void', description: '' },
        throws: [],
        tags: [],
        raw: '',
      },
      returnType: 'void',
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.type === 'missing-param');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('warning');
    expect(issue?.symbol).toBe('needs_param');
  });

  // ── 4. Function with missing @return → warning ───────────────────────────────
  it('detects a missing @return tag as a warning', () => {
    const fn = makePhpFunction({
      name: 'needs_return',
      returnType: 'string',
      params: [],
      doc: {
        description: 'Returns something.',
        params: [],
        returns: undefined, // missing @return
        throws: [],
        tags: [],
        raw: '',
      },
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.type === 'missing-return');
    expect(issue).toBeDefined();
    expect(issue?.severity).toBe('warning');
    expect(issue?.symbol).toBe('needs_return');
  });

  // ── 5. Class missing PHPDoc → error ──────────────────────────────────────────
  it('detects a class missing PHPDoc as an error', () => {
    const cls = makePhpClass({ name: 'UndocumentedClass', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [], [cls])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.symbol === 'UndocumentedClass');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('missing-doc');
    expect(issue?.severity).toBe('error');
  });

  // ── 6. stats.total counts functions + classes ────────────────────────────────
  it('stats.total counts functions and classes', () => {
    const fn = makePhpFunction({ name: 'fn1', doc: null });
    const cls = makePhpClass({ name: 'Cls1', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn], [cls])] });
    const { stats } = validateDocs(result);
    expect(stats.total).toBe(2);
  });

  // ── 7. stats.documented counts only documented symbols ───────────────────────
  it('stats.documented counts only documented symbols', () => {
    const docBlock = {
      description: 'Documented.',
      params: [],
      returns: undefined,
      throws: [],
      tags: [],
      raw: '',
    };
    const fn1 = makePhpFunction({ name: 'fn1', doc: docBlock });
    const fn2 = makePhpFunction({ name: 'fn2', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn1, fn2])] });
    const { stats } = validateDocs(result);
    expect(stats.total).toBe(2);
    expect(stats.documented).toBe(1);
  });

  // ── 8. Coverage percentage ────────────────────────────────────────────────────
  it('calculates 0% coverage when no symbols are documented', () => {
    const fn1 = makePhpFunction({ name: 'fn1', doc: null });
    const fn2 = makePhpFunction({ name: 'fn2', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn1, fn2])] });
    expect(validateDocs(result).stats.coverage).toBe(0);
  });

  it('calculates 100% coverage when all symbols are documented', () => {
    const docBlock = { description: 'OK', params: [], throws: [], tags: [], raw: '' };
    const fn = makePhpFunction({ name: 'fn', doc: docBlock, returnType: 'void' });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    expect(validateDocs(result).stats.coverage).toBe(100);
  });

  it('calculates 50% coverage when half are documented', () => {
    const docBlock = { description: 'OK', params: [], throws: [], tags: [], raw: '' };
    const fn1 = makePhpFunction({ name: 'fn1', doc: docBlock, returnType: 'void' });
    const fn2 = makePhpFunction({ name: 'fn2', doc: null });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn1, fn2])] });
    expect(validateDocs(result).stats.coverage).toBe(50);
  });

  // ── 9. JS function missing JSDoc → warning ───────────────────────────────────
  it('detects a JS function missing JSDoc as a warning', () => {
    const fn = makeJsFunction({ name: 'jsUndocumented', doc: null });
    const result = makeResult({ js: [makeJsResult('/tmp/plugin/index.js', [fn])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.symbol === 'jsUndocumented');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('missing-doc');
    expect(issue?.severity).toBe('warning');
  });

  it('does not flag a JS function with JSDoc', () => {
    const fn = makeJsFunction({
      name: 'jsDone',
      doc: {
        description: 'Documented JS function.',
        params: [],
        throws: [],
        tags: [],
        raw: '',
      },
    });
    const result = makeResult({ js: [makeJsResult('/tmp/plugin/index.js', [fn])] });
    const { issues } = validateDocs(result);
    expect(issues.filter((i) => i.symbol === 'jsDone')).toHaveLength(0);
  });

  // ── 10. Hook without description → incomplete-doc warning ────────────────────
  it('flags a dispatch hook inside a function with an empty PHPDoc description', () => {
    const fn = makePhpFunction({
      name: 'run_plugin',
      location: { file: '/tmp/plugin/plugin.php', line: 5, column: 0 },
      doc: {
        description: '', // empty description
        params: [],
        throws: [],
        tags: [],
        raw: '',
      },
      returnType: 'void',
    });
    const hook = makeHook({
      name: 'plugin_init',
      usage: 'dispatch',
      location: { file: '/tmp/plugin/plugin.php', line: 10, column: 0 },
    });
    const result = makeResult({
      php: [makePhpResult('/tmp/plugin/plugin.php', [fn])],
      hooks: [makeHookResult('/tmp/plugin/plugin.php', [hook])],
    });
    const { issues } = validateDocs(result);
    const hookIssue = issues.find((i) => i.type === 'incomplete-doc');
    expect(hookIssue).toBeDefined();
    expect(hookIssue?.severity).toBe('warning');
    expect(hookIssue?.symbol).toBe('plugin_init');
  });

  // ── 11. Public method missing PHPDoc → warning ────────────────────────────────
  it('flags a public method missing PHPDoc as a warning', () => {
    const method = makePublicMethod({ name: 'doSomething', doc: null });
    const cls = makePhpClass({
      name: 'MyClass',
      doc: { description: 'A class', params: [], throws: [], tags: [], raw: '' },
      methods: [method],
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [], [cls])] });
    const { issues } = validateDocs(result);
    const issue = issues.find((i) => i.symbol === 'MyClass::doSomething');
    expect(issue).toBeDefined();
    expect(issue?.type).toBe('missing-doc');
    expect(issue?.severity).toBe('warning');
  });

  // ── 12. Private/protected methods not checked ────────────────────────────────
  it('does not flag private or protected methods', () => {
    const privateMethod = makePublicMethod({
      name: 'privateMethod',
      visibility: 'private',
      doc: null,
    });
    const protectedMethod = makePublicMethod({
      name: 'protectedMethod',
      visibility: 'protected',
      doc: null,
    });
    const cls = makePhpClass({
      name: 'MyClass',
      doc: { description: 'A class', params: [], throws: [], tags: [], raw: '' },
      methods: [privateMethod, protectedMethod],
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [], [cls])] });
    const { issues } = validateDocs(result);
    expect(issues.filter((i) => i.type === 'missing-doc')).toHaveLength(0);
  });

  // ── 13. Void return type — no @return warning ────────────────────────────────
  it('does not flag a missing @return for void functions', () => {
    const fn = makePhpFunction({
      name: 'void_fn',
      returnType: 'void',
      doc: { description: 'Does nothing.', params: [], throws: [], tags: [], raw: '' },
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues } = validateDocs(result);
    expect(issues.filter((i) => i.type === 'missing-return')).toHaveLength(0);
  });

  // ── 14. Empty ParseResult → no issues, 100% coverage ────────────────────────
  it('returns 100% coverage for an empty ParseResult', () => {
    const result = makeResult();
    const { issues, stats } = validateDocs(result);
    expect(issues).toHaveLength(0);
    expect(stats.coverage).toBe(100);
    expect(stats.total).toBe(0);
  });

  // ── 15. Mixed PHP + JS symbols count correctly ───────────────────────────────
  it('counts PHP and JS symbols together in stats', () => {
    const phpFn = makePhpFunction({ name: 'php_fn', doc: null });
    const jsFn = makeJsFunction({ name: 'js_fn', doc: null });
    const result = makeResult({
      php: [makePhpResult('/tmp/plugin/plugin.php', [phpFn])],
      js: [makeJsResult('/tmp/plugin/index.js', [jsFn])],
    });
    const { stats } = validateDocs(result);
    expect(stats.total).toBe(2);
    expect(stats.documented).toBe(0);
    expect(stats.coverage).toBe(0);
  });

  // ── 16. @param check uses $name with or without $ prefix ────────────────────
  it('accepts @param tags that use the $name convention', () => {
    const fn = makePhpFunction({
      name: 'param_fn',
      params: [
        {
          name: '$foo',
          typeHint: 'string',
          nullable: false,
          hasDefault: false,
          defaultValue: null,
          variadic: false,
          byRef: false,
        },
      ],
      doc: {
        description: 'Does something.',
        params: [{ type: 'string', name: '$foo', description: 'The foo', optional: false }],
        throws: [],
        tags: [],
        raw: '',
      },
      returnType: 'void',
    });
    const result = makeResult({ php: [makePhpResult('/tmp/plugin/plugin.php', [fn])] });
    const { issues } = validateDocs(result);
    expect(issues.filter((i) => i.type === 'missing-param')).toHaveLength(0);
  });
});
